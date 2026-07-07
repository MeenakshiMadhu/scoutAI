"""
Synthetic job posting generator for scoutAI.
Produces 1500 realistic postings across very different fields.

Each posting includes:
  id, title, role_family, seniority, location, location_type,
  department, employment_type, date_posted, compensation,
  compensation_min, compensation_max, description
plus structured fields (skills, min_years) embedded and surfaced
so the hybrid matcher (filter -> vector rank) has clean signal.
"""

import json
import random
from datetime import date, timedelta

random.seed(42)  # reproducible dataset

TODAY = date(2026, 7, 2)

# ---------------------------------------------------------------------------
# Locations
# ---------------------------------------------------------------------------
LOCATIONS = [
    ("New York, NY", "US"), ("San Francisco, CA", "US"), ("Austin, TX", "US"),
    ("Seattle, WA", "US"), ("Chicago, IL", "US"), ("Boston, MA", "US"),
    ("Denver, CO", "US"), ("Atlanta, GA", "US"), ("Los Angeles, CA", "US"),
    ("Raleigh, NC", "US"), ("Portland, OR", "US"), ("Miami, FL", "US"),
    ("Minneapolis, MN", "US"), ("Nashville, TN", "US"), ("Phoenix, AZ", "US"),
    ("London, UK", "UK"), ("Toronto, ON", "CA"), ("Berlin, DE", "DE"),
    ("Bangalore, IN", "IN"), ("Remote (US)", "US"),
]

LOCATION_TYPES = ["On-site", "Remote", "Hybrid"]
EMPLOYMENT_TYPES = ["Full-time", "Contract", "Intern"]

SENIORITY_ORDER = ["Intern", "Junior", "Mid", "Senior", "Lead", "Director", "VP"]

# ---------------------------------------------------------------------------
# Role families. Each family has titles by seniority, a department,
# skill pools, and description building blocks. Kept deliberately diverse
# so the matcher has genuinely different fields to separate.
# ---------------------------------------------------------------------------
FAMILIES = {
    "Software Engineering": {
        "department": "Engineering",
        "titles": {
            "Intern": ["Software Engineering Intern", "Backend Engineering Intern"],
            "Junior": ["Junior Software Engineer", "Associate Software Engineer", "Software Engineer I"],
            "Mid": ["Software Engineer", "Backend Engineer", "Full-Stack Engineer"],
            "Senior": ["Senior Software Engineer", "Senior Backend Engineer", "Staff Engineer"],
            "Lead": ["Engineering Lead", "Principal Software Engineer", "Tech Lead"],
            "Director": ["Director of Engineering", "Engineering Manager"],
            "VP": ["VP of Engineering", "Head of Engineering"],
        },
        "skills": ["Python", "Java", "Go", "TypeScript", "React", "PostgreSQL",
                   "Kubernetes", "AWS", "distributed systems", "REST APIs",
                   "microservices", "CI/CD", "Docker", "gRPC"],
        "resp": [
            "design and ship backend services that handle high request volume",
            "build and maintain RESTful and gRPC APIs consumed by internal teams",
            "own a service end to end from design through production monitoring",
            "collaborate with product to translate requirements into technical design",
            "improve reliability, latency, and observability of core systems",
            "write well-tested, maintainable code and participate in code review",
        ],
        "req": [
            "experience with a modern backend language such as Python, Java, or Go",
            "familiarity with relational databases and query optimization",
            "understanding of distributed systems and API design",
            "comfort with cloud infrastructure (AWS, GCP, or Azure)",
        ],
    },
    "Data Science / ML": {
        "department": "Data & AI",
        "titles": {
            "Intern": ["Machine Learning Intern", "Data Science Intern"],
            "Junior": ["Junior Data Scientist", "Associate ML Engineer"],
            "Mid": ["Data Scientist", "Machine Learning Engineer"],
            "Senior": ["Senior Data Scientist", "Senior ML Engineer"],
            "Lead": ["Lead Data Scientist", "Principal ML Engineer"],
            "Director": ["Director of Data Science", "Head of ML"],
            "VP": ["VP of Data Science", "VP of AI"],
        },
        "skills": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "SQL",
                   "pandas", "NLP", "computer vision", "MLOps", "Spark",
                   "feature engineering", "A/B testing", "statistics"],
        "resp": [
            "build and evaluate predictive models on large datasets",
            "own the model lifecycle from experimentation to deployment",
            "partner with engineering to productionize ML pipelines",
            "design experiments and interpret results to guide product decisions",
            "develop NLP or recommendation systems that power core features",
        ],
        "req": [
            "strong grounding in statistics and machine learning fundamentals",
            "proficiency in Python and its ML ecosystem",
            "experience taking a model from prototype to production",
            "ability to communicate findings to non-technical stakeholders",
        ],
    },
    "Nursing / Clinical": {
        "department": "Clinical Services",
        "titles": {
            "Intern": ["Nursing Extern", "Clinical Intern"],
            "Junior": ["Graduate Nurse", "Licensed Practical Nurse"],
            "Mid": ["Registered Nurse (RN)", "Staff Nurse", "ICU Nurse"],
            "Senior": ["Senior Registered Nurse", "Charge Nurse"],
            "Lead": ["Nurse Manager", "Clinical Nurse Lead"],
            "Director": ["Director of Nursing", "Clinical Services Director"],
            "VP": ["VP of Patient Care", "Chief Nursing Officer"],
        },
        "skills": ["patient care", "IV therapy", "EHR/Epic", "triage",
                   "medication administration", "BLS/ACLS certification",
                   "care planning", "wound care", "patient assessment"],
        "resp": [
            "provide direct patient care in a fast-paced clinical setting",
            "assess patient conditions and develop care plans with the care team",
            "administer medications and treatments per physician orders",
            "document care accurately in the electronic health record",
            "educate patients and families on treatment and discharge plans",
        ],
        "req": [
            "active RN or LPN license in the state of practice",
            "current BLS/ACLS certification",
            "experience in an acute-care or hospital setting",
            "strong clinical assessment and communication skills",
        ],
    },
    "Product Management": {
        "department": "Product",
        "titles": {
            "Intern": ["Product Management Intern", "APM Intern"],
            "Junior": ["Associate Product Manager", "Product Analyst"],
            "Mid": ["Product Manager", "Technical Product Manager"],
            "Senior": ["Senior Product Manager", "Senior PM"],
            "Lead": ["Lead Product Manager", "Principal PM"],
            "Director": ["Director of Product", "Group Product Manager"],
            "VP": ["VP of Product", "Chief Product Officer"],
        },
        "skills": ["product strategy", "roadmapping", "user research", "SQL",
                   "A/B testing", "stakeholder management", "analytics",
                   "wireframing", "go-to-market", "prioritization"],
        "resp": [
            "own the roadmap for a product area and align stakeholders behind it",
            "translate user needs and data into a prioritized backlog",
            "partner with engineering and design to ship and iterate",
            "define success metrics and measure impact post-launch",
            "conduct user research to validate problems worth solving",
        ],
        "req": [
            "track record shipping products in a cross-functional environment",
            "comfort with data and analytics to inform decisions",
            "strong written and verbal communication",
            "ability to balance user needs, business goals, and technical constraints",
        ],
    },
    "Design / UX": {
        "department": "Design",
        "titles": {
            "Intern": ["UX Design Intern", "Product Design Intern"],
            "Junior": ["Junior Product Designer", "UX Designer I"],
            "Mid": ["Product Designer", "UX/UI Designer"],
            "Senior": ["Senior Product Designer", "Senior UX Designer"],
            "Lead": ["Lead Designer", "Design Lead"],
            "Director": ["Director of Design", "Head of Design"],
            "VP": ["VP of Design", "Chief Design Officer"],
        },
        "skills": ["Figma", "user research", "prototyping", "design systems",
                   "interaction design", "wireframing", "usability testing",
                   "visual design", "accessibility"],
        "resp": [
            "design intuitive end-to-end flows for web and mobile products",
            "build and maintain a scalable design system",
            "run usability tests and translate findings into design changes",
            "partner closely with PM and engineering from concept to ship",
            "craft high-fidelity prototypes to communicate interaction ideas",
        ],
        "req": [
            "a portfolio demonstrating shipped product work",
            "fluency in Figma and modern design tooling",
            "strong grasp of interaction and visual design fundamentals",
            "experience collaborating with engineers on implementation",
        ],
    },
    "Sales": {
        "department": "Revenue",
        "titles": {
            "Intern": ["Sales Development Intern"],
            "Junior": ["Sales Development Representative", "Business Development Rep"],
            "Mid": ["Account Executive", "Mid-Market AE"],
            "Senior": ["Senior Account Executive", "Enterprise AE"],
            "Lead": ["Sales Team Lead", "Regional Sales Manager"],
            "Director": ["Director of Sales", "Head of Sales"],
            "VP": ["VP of Sales", "Chief Revenue Officer"],
        },
        "skills": ["prospecting", "CRM/Salesforce", "negotiation", "pipeline management",
                   "cold outreach", "SaaS sales", "quota attainment",
                   "discovery calls", "forecasting"],
        "resp": [
            "own a pipeline and consistently meet or exceed quota",
            "run the full sales cycle from prospecting to close",
            "build relationships with decision-makers at target accounts",
            "partner with marketing and product to refine positioning",
            "forecast accurately and manage opportunities in the CRM",
        ],
        "req": [
            "a track record of hitting quota in a B2B or SaaS environment",
            "strong discovery, negotiation, and closing skills",
            "experience managing a pipeline in Salesforce or similar",
            "excellent written and verbal communication",
        ],
    },
    "Marketing": {
        "department": "Marketing",
        "titles": {
            "Intern": ["Marketing Intern", "Content Marketing Intern"],
            "Junior": ["Marketing Coordinator", "Content Associate"],
            "Mid": ["Marketing Manager", "Growth Marketer"],
            "Senior": ["Senior Marketing Manager", "Senior Growth Marketer"],
            "Lead": ["Marketing Lead", "Principal Growth Marketer"],
            "Director": ["Director of Marketing", "Head of Growth"],
            "VP": ["VP of Marketing", "Chief Marketing Officer"],
        },
        "skills": ["SEO/SEM", "content strategy", "email marketing", "analytics",
                   "paid acquisition", "brand", "marketing automation", "copywriting",
                   "Google Analytics", "campaign management"],
        "resp": [
            "own acquisition channels and grow qualified pipeline",
            "develop content and campaigns that drive measurable growth",
            "analyze funnel metrics and optimize conversion",
            "manage paid and organic channels against a budget",
            "partner with sales to align on lead quality and handoff",
        ],
        "req": [
            "experience running growth or content programs with measurable results",
            "fluency with analytics and marketing automation tools",
            "strong writing and storytelling skills",
            "data-driven approach to channel optimization",
        ],
    },
    "Finance / Accounting": {
        "department": "Finance",
        "titles": {
            "Intern": ["Finance Intern", "Accounting Intern"],
            "Junior": ["Junior Accountant", "Financial Analyst I"],
            "Mid": ["Financial Analyst", "Staff Accountant"],
            "Senior": ["Senior Financial Analyst", "Senior Accountant"],
            "Lead": ["Finance Lead", "Accounting Manager"],
            "Director": ["Director of Finance", "Controller"],
            "VP": ["VP of Finance", "Chief Financial Officer"],
        },
        "skills": ["financial modeling", "Excel", "GAAP", "forecasting",
                   "budgeting", "variance analysis", "SQL", "financial reporting",
                   "reconciliation", "audit"],
        "resp": [
            "build financial models and support budgeting and forecasting",
            "prepare monthly close and financial reporting",
            "analyze variance and surface insights to leadership",
            "partner with business units on planning and spend",
            "ensure compliance with GAAP and internal controls",
        ],
        "req": [
            "strong financial modeling and Excel skills",
            "understanding of GAAP and financial statements",
            "attention to detail and analytical rigor",
            "experience with month-end close or FP&A processes",
        ],
    },
    "Operations / Supply Chain": {
        "department": "Operations",
        "titles": {
            "Intern": ["Operations Intern", "Supply Chain Intern"],
            "Junior": ["Operations Associate", "Logistics Coordinator"],
            "Mid": ["Operations Manager", "Supply Chain Analyst"],
            "Senior": ["Senior Operations Manager", "Senior Supply Chain Manager"],
            "Lead": ["Operations Lead", "Regional Operations Manager"],
            "Director": ["Director of Operations", "Head of Supply Chain"],
            "VP": ["VP of Operations", "Chief Operating Officer"],
        },
        "skills": ["process improvement", "logistics", "inventory management",
                   "vendor management", "Lean/Six Sigma", "forecasting", "SQL",
                   "ERP systems", "demand planning"],
        "resp": [
            "own operational processes and drive continuous improvement",
            "manage logistics, inventory, and vendor relationships",
            "build forecasting and demand-planning processes",
            "define and track operational KPIs",
            "scale processes as the business grows",
        ],
        "req": [
            "experience improving operational or supply-chain processes",
            "comfort with data and ERP/inventory systems",
            "strong project management and coordination skills",
            "Lean or Six Sigma exposure a plus",
        ],
    },
    "Legal / Compliance": {
        "department": "Legal",
        "titles": {
            "Intern": ["Legal Intern"],
            "Junior": ["Paralegal", "Compliance Analyst"],
            "Mid": ["Corporate Counsel", "Compliance Manager"],
            "Senior": ["Senior Counsel", "Senior Compliance Manager"],
            "Lead": ["Lead Counsel", "Principal Compliance Officer"],
            "Director": ["Director of Legal", "Head of Compliance"],
            "VP": ["VP of Legal", "General Counsel"],
        },
        "skills": ["contract review", "regulatory compliance", "corporate law",
                   "risk assessment", "policy drafting", "litigation support",
                   "GDPR/CCPA", "negotiation"],
        "resp": [
            "review, draft, and negotiate commercial contracts",
            "advise the business on regulatory and compliance matters",
            "build and maintain compliance policies and programs",
            "assess legal risk and recommend mitigations",
            "partner cross-functionally on privacy and data protection",
        ],
        "req": [
            "JD and active bar admission for counsel roles",
            "experience with commercial contracts and regulatory frameworks",
            "strong drafting and negotiation skills",
            "sound judgment on legal and business risk",
        ],
    },
    "Customer Support / Success": {
        "department": "Customer Experience",
        "titles": {
            "Intern": ["Customer Support Intern"],
            "Junior": ["Customer Support Representative", "Support Associate"],
            "Mid": ["Customer Success Manager", "Support Engineer"],
            "Senior": ["Senior Customer Success Manager", "Senior Support Engineer"],
            "Lead": ["Customer Success Lead", "Support Team Lead"],
            "Director": ["Director of Customer Success", "Head of Support"],
            "VP": ["VP of Customer Success", "Chief Customer Officer"],
        },
        "skills": ["customer relationship management", "SaaS", "onboarding",
                   "troubleshooting", "CRM", "account management", "churn reduction",
                   "product knowledge", "escalation management"],
        "resp": [
            "own a book of accounts and drive retention and expansion",
            "onboard new customers and ensure they reach value quickly",
            "troubleshoot issues and coordinate with engineering on escalations",
            "identify churn risk and drive proactive outreach",
            "advocate for customer needs internally",
        ],
        "req": [
            "experience in a customer-facing SaaS role",
            "strong communication and relationship-building skills",
            "comfort troubleshooting technical products",
            "data-driven approach to retention and expansion",
        ],
    },
    "HR / People": {
        "department": "People",
        "titles": {
            "Intern": ["HR Intern", "People Ops Intern"],
            "Junior": ["HR Coordinator", "Recruiting Coordinator"],
            "Mid": ["HR Business Partner", "Technical Recruiter"],
            "Senior": ["Senior HRBP", "Senior Recruiter"],
            "Lead": ["People Ops Lead", "Recruiting Lead"],
            "Director": ["Director of People", "Head of Talent"],
            "VP": ["VP of People", "Chief People Officer"],
        },
        "skills": ["recruiting", "employee relations", "HRIS", "onboarding",
                   "performance management", "compensation", "DEI",
                   "talent acquisition", "people analytics"],
        "resp": [
            "partner with leaders on org design, hiring, and performance",
            "own full-cycle recruiting for assigned teams",
            "build and run people programs (onboarding, reviews, engagement)",
            "advise managers on employee relations matters",
            "use people data to inform talent decisions",
        ],
        "req": [
            "experience in an HR, recruiting, or people-ops role",
            "strong interpersonal and coaching skills",
            "familiarity with HRIS and applicant-tracking systems",
            "sound judgment and discretion with sensitive matters",
        ],
    },
    "Data Engineering": {
        "department": "Data & AI",
        "titles": {
            "Intern": ["Data Engineering Intern"],
            "Junior": ["Junior Data Engineer", "Analytics Engineer I"],
            "Mid": ["Data Engineer", "Analytics Engineer"],
            "Senior": ["Senior Data Engineer", "Senior Analytics Engineer"],
            "Lead": ["Lead Data Engineer", "Principal Data Engineer"],
            "Director": ["Director of Data Engineering", "Head of Data Platform"],
            "VP": ["VP of Data", "VP of Data Platform"],
        },
        "skills": ["Python", "SQL", "Spark", "Airflow", "dbt", "Kafka",
                   "data warehousing", "ETL/ELT", "Snowflake", "AWS",
                   "data modeling", "streaming"],
        "resp": [
            "build and maintain batch and streaming data pipelines",
            "design data models and warehouse schemas for analytics",
            "own data quality, lineage, and pipeline reliability",
            "partner with analysts and scientists on data availability",
            "scale ingestion and processing as data volume grows",
        ],
        "req": [
            "strong SQL and Python for data processing",
            "experience with a distributed processing framework such as Spark",
            "familiarity with orchestration (Airflow) and warehousing",
            "understanding of data modeling and ETL best practices",
        ],
    },
    "DevOps / Infrastructure": {
        "department": "Engineering",
        "titles": {
            "Intern": ["DevOps Intern", "SRE Intern"],
            "Junior": ["Junior DevOps Engineer", "Junior SRE"],
            "Mid": ["DevOps Engineer", "Site Reliability Engineer"],
            "Senior": ["Senior DevOps Engineer", "Senior SRE"],
            "Lead": ["Infrastructure Lead", "Principal SRE"],
            "Director": ["Director of Infrastructure", "Head of Platform"],
            "VP": ["VP of Infrastructure", "VP of Platform Engineering"],
        },
        "skills": ["Kubernetes", "Terraform", "AWS", "CI/CD", "Docker",
                   "observability", "Prometheus", "Linux", "networking",
                   "incident response", "IaC"],
        "resp": [
            "own the CI/CD and deployment infrastructure",
            "manage Kubernetes clusters and cloud infrastructure as code",
            "improve reliability, on-call, and incident response",
            "build observability and alerting for production systems",
            "drive down cost and toil through automation",
        ],
        "req": [
            "hands-on experience with Kubernetes and a major cloud provider",
            "infrastructure-as-code experience (Terraform or similar)",
            "strong Linux and networking fundamentals",
            "experience running production systems and on-call",
        ],
    },
    "Skilled Trades / Facilities": {
        "department": "Facilities",
        "titles": {
            "Intern": ["Maintenance Apprentice"],
            "Junior": ["Maintenance Technician", "Facilities Associate"],
            "Mid": ["HVAC Technician", "Electrician", "Facilities Technician"],
            "Senior": ["Senior Facilities Technician", "Lead Electrician"],
            "Lead": ["Facilities Lead", "Maintenance Supervisor"],
            "Director": ["Director of Facilities", "Facilities Manager"],
            "VP": ["VP of Facilities", "Head of Real Estate & Facilities"],
        },
        "skills": ["HVAC", "electrical", "plumbing", "preventive maintenance",
                   "building systems", "safety compliance", "troubleshooting",
                   "blueprints", "OSHA"],
        "resp": [
            "perform preventive and corrective maintenance on building systems",
            "diagnose and repair HVAC, electrical, or plumbing issues",
            "ensure facilities meet safety and compliance standards",
            "respond to facilities requests and minimize downtime",
            "coordinate with vendors on larger repairs",
        ],
        "req": [
            "relevant trade certification or licensure",
            "hands-on experience maintaining building systems",
            "knowledge of safety and OSHA standards",
            "reliable troubleshooting and repair skills",
        ],
    },
}

# ---------------------------------------------------------------------------
# Seniority -> min years of experience, comp scaling, description tone
# ---------------------------------------------------------------------------
SENIORITY_META = {
    "Intern":   {"years": (0, 0),  "comp": (25, 45),   "level_line": "an entry-level, learning-focused role for current students or recent grads"},
    "Junior":   {"years": (0, 2),  "comp": (60, 95),   "level_line": "an early-career role; 0-2 years of relevant experience"},
    "Mid":      {"years": (2, 5),  "comp": (95, 150),  "level_line": "a mid-level role; typically 2-5 years of relevant experience"},
    "Senior":   {"years": (5, 8),  "comp": (140, 210), "level_line": "a senior individual-contributor role; 5+ years of experience"},
    "Lead":     {"years": (7, 10), "comp": (170, 250), "level_line": "a lead role blending deep expertise with technical direction; 7+ years"},
    "Director": {"years": (9, 14), "comp": (200, 300), "level_line": "a leadership role owning a function and managing teams; 9+ years"},
    "VP":       {"years": (12, 20),"comp": (250, 420), "level_line": "an executive role owning strategy and org-level outcomes; 12+ years"},
}

# Comp is scaled down for non-tech-heavy families to stay realistic
COMP_MULTIPLIER = {
    "Software Engineering": 1.0, "Data Science / ML": 1.0, "Data Engineering": 1.0,
    "DevOps / Infrastructure": 1.0, "Product Management": 1.0, "Legal / Compliance": 1.0,
    "Finance / Accounting": 0.85, "Design / UX": 0.85, "Sales": 0.9, "Marketing": 0.8,
    "Operations / Supply Chain": 0.8, "Nursing / Clinical": 0.75,
    "Customer Support / Success": 0.7, "HR / People": 0.75,
    "Skilled Trades / Facilities": 0.6,
}

COMPANIES = [
    "Northwind", "Cobalt Labs", "Meridian Health", "Brightpath", "Vellum",
    "Ironclad Systems", "Larkspur", "Auften", "Cascade Retail", "Beacon Financial",
    "Verdant", "Quill", "Harborview Medical", "Stratus Cloud", "Ondo",
    "Piedmont Logistics", "Fern & Oak", "Kestrel Analytics", "Summit Public Sector",
    "Nimbus", "Ridgeline Energy", "Alder Foods", "Tessellate", "Copperline",
]


def make_description(family_name, fam, seniority, title, company, loc, loc_type, emp_type, skills, min_years):
    meta = SENIORITY_META[seniority]
    resp = random.sample(fam["resp"], k=min(3, len(fam["resp"])))
    req = random.sample(fam["req"], k=min(3, len(fam["req"])))
    chosen_skills = random.sample(fam["skills"], k=min(6, len(fam["skills"])))

    years_line = (
        "No prior professional experience required."
        if min_years == 0 else
        f"Minimum {min_years}+ years of relevant experience."
    )

    parts = []
    parts.append(f"{company} is hiring a {title} to join our {fam['department']} team in {loc} ({loc_type}, {emp_type}).")
    parts.append(f"This is {meta['level_line']}.")
    parts.append("")
    parts.append("What you'll do:")
    for r in resp:
        parts.append(f"  - You will {r}.")
    parts.append("")
    parts.append("What we're looking for:")
    parts.append(f"  - {years_line}")
    for r in req:
        parts.append(f"  - {r.capitalize()}.")
    parts.append(f"  - Familiarity with: {', '.join(chosen_skills)}.")
    parts.append("")
    if emp_type == "Intern":
        parts.append("This internship runs for 12 weeks with the possibility of a return offer.")
    elif emp_type == "Contract":
        parts.append("This is an initial 6-12 month contract with potential to convert.")
    else:
        parts.append("Full-time role with benefits, equity (where applicable), and PTO.")
    return "\n".join(parts)


def scale_comp(family_name, seniority, emp_type):
    lo, hi = SENIORITY_META[seniority]["comp"]
    mult = COMP_MULTIPLIER.get(family_name, 0.85)
    lo = int(lo * mult)
    hi = int(hi * mult)
    if emp_type == "Intern":
        # hourly-ish framing for interns, in $ thousands annualized we drop to stipend
        cmin = random.randint(6, 10) * 1000  # monthly-ish stipend nonsense avoided
        # represent intern comp as hourly
        hourly = random.randint(30, 55)
        return f"${hourly}/hour", hourly, hourly
    if emp_type == "Contract":
        rate = random.randint(int(lo * 0.6), int(hi * 0.7))
        return f"${rate}/hour equivalent", lo * 1000, hi * 1000
    cmin = random.randint(lo, (lo + hi) // 2) * 1000
    cmax = random.randint((lo + hi) // 2, hi) * 1000
    return f"${cmin:,} - ${cmax:,}", cmin, cmax


def generate(n=1500):
    jobs = []
    family_names = list(FAMILIES.keys())
    # weight tech families a bit higher (realistic for this kind of board) but keep everything well represented
    weights = []
    for fn in family_names:
        if fn in ("Software Engineering", "Data Science / ML", "Data Engineering",
                  "DevOps / Infrastructure", "Product Management"):
            weights.append(2.2)
        else:
            weights.append(1.0)

    # seniority distribution: mostly IC roles, fewer executives
    sen_names = SENIORITY_ORDER
    sen_weights = [0.06, 0.16, 0.30, 0.24, 0.10, 0.09, 0.05]  # Intern..VP

    jid = 1000
    for _ in range(n):
        family_name = random.choices(family_names, weights=weights, k=1)[0]
        fam = FAMILIES[family_name]

        # pick a seniority that actually has a title for this family
        while True:
            seniority = random.choices(sen_names, weights=sen_weights, k=1)[0]
            if seniority in fam["titles"] and fam["titles"][seniority]:
                break

        title = random.choice(fam["titles"][seniority])
        loc, country = random.choice(LOCATIONS)
        loc_type = "Remote" if loc.startswith("Remote") else random.choice(LOCATION_TYPES)

        # employment type constrained by seniority
        if seniority == "Intern":
            emp_type = "Intern"
        elif seniority in ("Director", "VP"):
            emp_type = "Full-time"
        else:
            emp_type = random.choices(EMPLOYMENT_TYPES, weights=[0.8, 0.15, 0.05], k=1)[0]
            if emp_type == "Intern":  # only true interns are interns
                emp_type = "Full-time"

        yr_lo, yr_hi = SENIORITY_META[seniority]["years"]
        min_years = yr_lo

        skills = fam["skills"]
        company = random.choice(COMPANIES)
        comp_str, cmin, cmax = scale_comp(family_name, seniority, emp_type)

        days_ago = random.randint(0, 45)
        posted = TODAY - timedelta(days=days_ago)

        desc = make_description(family_name, fam, seniority, title, company,
                                loc, loc_type, emp_type, skills, min_years)

        jobs.append({
            "id": f"JOB-{jid}",
            "title": title,
            "company": company,
            "role_family": family_name,
            "seniority": seniority,
            "seniority_rank": SENIORITY_ORDER.index(seniority),
            "min_years": min_years,
            "location": loc,
            "country": country,
            "location_type": loc_type,
            "department": fam["department"],
            "employment_type": emp_type,
            "date_posted": posted.isoformat(),
            "compensation": comp_str,
            "compensation_min": cmin,
            "compensation_max": cmax,
            "skills": random.sample(fam["skills"], k=min(6, len(fam["skills"]))),
            "description": desc,
        })
        jid += 1

    return jobs


if __name__ == "__main__":
    jobs = generate(1500)
    with open("jobs.json", "w") as f:
        json.dump(jobs, f, indent=2)

    # quick distribution report
    from collections import Counter
    fam_counts = Counter(j["role_family"] for j in jobs)
    sen_counts = Counter(j["seniority"] for j in jobs)
    emp_counts = Counter(j["employment_type"] for j in jobs)
    loct_counts = Counter(j["location_type"] for j in jobs)

    print(f"Generated {len(jobs)} jobs\n")
    print("By role family:")
    for k, v in sorted(fam_counts.items(), key=lambda x: -x[1]):
        print(f"  {v:>4}  {k}")
    print("\nBy seniority:")
    for k in SENIORITY_ORDER:
        print(f"  {sen_counts.get(k,0):>4}  {k}")
    print("\nBy employment type:")
    for k, v in emp_counts.items():
        print(f"  {v:>4}  {k}")
    print("\nBy location type:")
    for k, v in loct_counts.items():
        print(f"  {v:>4}  {k}")
