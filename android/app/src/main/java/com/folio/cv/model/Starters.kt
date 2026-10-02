package com.folio.cv.model

/** The ways a new CV can begin. Sample content is fictional and meant to be overwritten. */
enum class Starter(val title: String, val subtitle: String, val templateId: String) {
    BLANK("Blank", "Start with empty sections", "cupertino"),
    MECHANICAL("Mechanical engineer", "Design engineer sample, 6 years", "torque"),
    MECHANICAL_GRADUATE("Mechanical engineering graduate", "Projects-first, one page", "datum"),
    PROFESSIONAL("Professional", "Product manager sample", "cupertino"),
}

object Starters {

    fun create(starter: Starter, now: Long, pageSize: PageSize = PageSize.A4): Resume {
        val base = when (starter) {
            Starter.BLANK -> blank()
            Starter.MECHANICAL -> mechanicalEngineer()
            Starter.MECHANICAL_GRADUATE -> mechanicalGraduate()
            Starter.PROFESSIONAL -> professional()
        }
        return base.copy(
            id = Ids.new(),
            createdAt = now,
            updatedAt = now,
            style = base.style.copy(templateId = starter.templateId, pageSize = pageSize),
        )
    }

    fun emptySection(type: SectionType): Section = Section(
        id = Ids.new(),
        type = type,
        entries = if (type.content == SectionContent.ENTRIES) listOf(Entry(Ids.new())) else emptyList(),
        groups = if (type.content == SectionContent.GROUPS) listOf(SkillGroup(Ids.new())) else emptyList(),
    )

    private fun blank() = Resume(
        id = "",
        name = "My CV",
        sections = listOf(
            emptySection(SectionType.SUMMARY),
            emptySection(SectionType.EXPERIENCE),
            emptySection(SectionType.EDUCATION),
            emptySection(SectionType.SKILLS),
        ),
    )

    private fun entry(
        title: String, org: String, location: String = "", start: String = "", end: String = "",
        current: Boolean = false, description: String = "", bullets: List<String> = emptyList(),
        tags: List<String> = emptyList(),
    ) = Entry(Ids.new(), title, org, location, start, end, current, description, bullets, tags)

    private fun group(name: String, vararg items: String) = SkillGroup(Ids.new(), name, items.toList())

    private fun mechanicalEngineer() = Resume(
        id = "",
        name = "Mechanical Engineer CV",
        header = Header(
            fullName = "Daniel Okafor",
            headline = "Mechanical Design Engineer",
            credentials = "PE, CSWP",
            email = "daniel.okafor@email.com",
            phone = "+1 (614) 555-0142",
            location = "Columbus, OH",
            linkedin = "linkedin.com/in/danielokafor",
        ),
        sections = listOf(
            Section(
                Ids.new(), SectionType.SUMMARY,
                text = "Licensed mechanical engineer with 6 years designing electromechanical assemblies " +
                    "for automotive and industrial equipment. Takes products from concept through DFMEA, " +
                    "prototype and validation to production release, with a record of cutting unit cost " +
                    "and test cycle time without trading away reliability.",
            ),
            Section(
                Ids.new(), SectionType.EXPERIENCE,
                entries = listOf(
                    entry(
                        "Senior Mechanical Design Engineer", "Northfield Drive Systems", "Columbus, OH",
                        "2022-04", current = true,
                        bullets = listOf(
                            "Led mechanical design of a 48 V e-axle gearbox housing from concept to SOP, delivering 22% mass reduction through topology optimization in ANSYS.",
                            "Owned DFMEA and DVP&R for 14 subsystems; closed 31 high-RPN failure modes before tooling kickoff.",
                            "Applied GD&T (ASME Y14.5-2018) and tolerance stack-ups that cut scrap on the machined housing from 4.1% to 0.9%.",
                            "Mentored 3 junior engineers and introduced a design-review checklist now used across the 40-person team.",
                        ),
                        tags = listOf("SolidWorks", "ANSYS Mechanical", "GD&T", "DFMEA"),
                    ),
                    entry(
                        "Mechanical Engineer", "Apex Industrial Automation", "Dayton, OH",
                        "2019-06", "2022-03",
                        bullets = listOf(
                            "Designed sheet-metal and cast enclosures for 9 robotic work cells, each IP65 rated and released on schedule.",
                            "Ran thermal and modal FEA that removed a resonance at 180 Hz and resolved a recurring field failure.",
                            "Partnered with suppliers on DFM reviews, lowering average part cost 15% across 120 drawings.",
                        ),
                        tags = listOf("Creo", "FEA", "DFM", "Sheet metal"),
                    ),
                    entry(
                        "Engineering Co-op", "Midwest Pump & Valve", "Cincinnati, OH",
                        "2018-01", "2018-08",
                        bullets = listOf(
                            "Built a test rig and LabVIEW data logger that shortened valve endurance testing by 30%.",
                        ),
                    ),
                ),
            ),
            Section(
                Ids.new(), SectionType.SKILLS,
                groups = listOf(
                    group("CAD / CAE", "SolidWorks", "Creo", "Siemens NX", "ANSYS Mechanical", "Fluent (CFD)"),
                    group("Design & analysis", "GD&T", "Tolerance stack-up", "FEA", "DFMEA", "DFM / DFA", "Root cause analysis"),
                    group("Manufacturing", "CNC machining", "Die casting", "Injection molding", "Sheet metal", "Additive"),
                    group("Tools", "MATLAB", "Python", "LabVIEW", "Minitab", "Teamcenter PLM"),
                ),
            ),
            Section(
                Ids.new(), SectionType.PROJECTS,
                entries = listOf(
                    entry(
                        "Lightweight e-axle housing", "Northfield Drive Systems", start = "2023",
                        description = "Topology-optimized aluminium housing validated to 1.5x peak torque; 22% lighter, same cost.",
                        tags = listOf("Topology optimization", "ANSYS"),
                    ),
                ),
            ),
            Section(
                Ids.new(), SectionType.EDUCATION,
                entries = listOf(
                    entry(
                        "B.S. Mechanical Engineering", "The Ohio State University", "Columbus, OH",
                        "2015", "2019", description = "GPA 3.7 / 4.0. Senior design: Formula SAE suspension uprights.",
                    ),
                ),
            ),
            Section(
                Ids.new(), SectionType.CERTIFICATIONS,
                entries = listOf(
                    entry("Professional Engineer (PE), Ohio", "State Board of Registration", start = "2023"),
                    entry("Certified SOLIDWORKS Professional (CSWP)", "Dassault Systèmes", start = "2020"),
                    entry("Lean Six Sigma Green Belt", "ASQ", start = "2021"),
                ),
            ),
            Section(
                Ids.new(), SectionType.PATENTS,
                entries = listOf(
                    entry("Gearbox housing with integrated coolant gallery", "US patent application (pending)", start = "2024"),
                ),
            ),
        ),
    )

    private fun mechanicalGraduate() = Resume(
        id = "",
        name = "Graduate Mechanical Engineer CV",
        header = Header(
            fullName = "Aisha Rahman",
            headline = "Graduate Mechanical Engineer",
            email = "aisha.rahman@email.com",
            phone = "+44 7700 900123",
            location = "Manchester, UK",
            github = "github.com/aisharahman",
        ),
        sections = listOf(
            Section(
                Ids.new(), SectionType.SUMMARY,
                text = "MEng graduate focused on thermofluids and product design. Hands-on with CAD, CFD and " +
                    "rapid prototyping through Formula Student and an 8-month industrial placement.",
            ),
            Section(
                Ids.new(), SectionType.EDUCATION,
                entries = listOf(
                    entry(
                        "MEng Mechanical Engineering, First Class", "University of Manchester", "Manchester, UK",
                        "2020", "2024",
                        bullets = listOf(
                            "Thesis: CFD study of pin-fin heat sinks for EV inverters; 12% lower junction temperature than baseline.",
                            "Modules: Finite Element Methods, Heat Transfer, Control Systems, Design for Manufacture.",
                        ),
                    ),
                ),
            ),
            Section(
                Ids.new(), SectionType.PROJECTS,
                entries = listOf(
                    entry(
                        "Chassis Lead, Formula Student", "UoM Racing", start = "2022", end = "2024",
                        bullets = listOf(
                            "Led a team of 6 designing a steel spaceframe; increased torsional stiffness 18% at equal mass.",
                            "Validated the frame in ANSYS and on a custom twist rig built from recycled stock.",
                        ),
                        tags = listOf("SolidWorks", "ANSYS", "Welding"),
                    ),
                    entry(
                        "Low-cost prosthetic hand", "Final-year group project", start = "2023",
                        description = "3D-printed tendon-driven hand with 5 grip patterns for under £150 in parts.",
                        tags = listOf("Fusion 360", "Arduino", "FDM"),
                    ),
                ),
            ),
            Section(
                Ids.new(), SectionType.EXPERIENCE,
                entries = listOf(
                    entry(
                        "Industrial Placement, Mechanical Engineering", "Rolls-Royce", "Derby, UK",
                        "2022-07", "2023-02",
                        bullets = listOf(
                            "Produced 40+ detailed drawings to BS 8888 for turbine test fixtures.",
                            "Automated a tolerance stack-up spreadsheet in Python, saving 6 hours a week for the team.",
                        ),
                    ),
                ),
            ),
            Section(
                Ids.new(), SectionType.SKILLS,
                groups = listOf(
                    group("CAD / CAE", "SolidWorks", "Fusion 360", "ANSYS Fluent", "ANSYS Mechanical"),
                    group("Making", "3D printing", "CNC basics", "MIG welding", "Arduino"),
                    group("Analysis", "MATLAB", "Python", "Simulink"),
                ),
            ),
            Section(
                Ids.new(), SectionType.CERTIFICATIONS,
                entries = listOf(entry("Certified SOLIDWORKS Associate (CSWA)", "Dassault Systèmes", start = "2022")),
            ),
        ),
    )

    private fun professional() = Resume(
        id = "",
        name = "Product Manager CV",
        header = Header(
            fullName = "Maya Chen",
            headline = "Senior Product Manager",
            email = "maya.chen@email.com",
            phone = "+1 (415) 555-0199",
            location = "San Francisco, CA",
            website = "mayachen.design",
            linkedin = "linkedin.com/in/mayachen",
        ),
        sections = listOf(
            Section(
                Ids.new(), SectionType.SUMMARY,
                text = "Product manager with 8 years shipping consumer mobile apps used by millions. " +
                    "Known for crisp problem framing, fast iteration and teams that enjoy the work. " +
                    "Most at home where research, design and engineering meet.",
            ),
            Section(
                Ids.new(), SectionType.EXPERIENCE,
                entries = listOf(
                    entry(
                        "Senior Product Manager", "Brightline", "San Francisco, CA", "2021-02", current = true,
                        bullets = listOf(
                            "Led the redesign of onboarding, lifting day-7 retention from 31% to 44%.",
                            "Shipped a subscription tier that reached \$12M ARR within 9 months.",
                            "Grew the product team from 3 to 9 and set up quarterly planning with design and engineering.",
                        ),
                    ),
                    entry(
                        "Product Manager", "Fieldnote", "Oakland, CA", "2017-06", "2021-01",
                        bullets = listOf(
                            "Launched offline sync for 2M users with a 99.98% conflict-free rate.",
                            "Built the experimentation practice from zero to 40 tests a quarter.",
                        ),
                    ),
                    entry(
                        "Associate Product Manager", "Lumen Labs", "San Jose, CA", "2015-07", "2017-05",
                        bullets = listOf(
                            "Ran 60+ customer interviews that reshaped the roadmap for the analytics product.",
                        ),
                    ),
                ),
            ),
            Section(
                Ids.new(), SectionType.EDUCATION,
                entries = listOf(entry("B.A. Cognitive Science", "UC Berkeley", "Berkeley, CA", "2013", "2017")),
            ),
            Section(
                Ids.new(), SectionType.SKILLS,
                groups = listOf(
                    group("", "Product strategy", "User research", "Experimentation", "SQL", "Figma", "Roadmapping"),
                ),
            ),
            Section(
                Ids.new(), SectionType.LANGUAGES,
                groups = listOf(group("", "English (native)", "Mandarin (fluent)")),
            ),
            Section(
                Ids.new(), SectionType.REFERENCES,
                entries = listOf(
                    entry("Daniel Park", "Brightline / VP Product", description = "daniel.park@brightline.com\n+1 (415) 555-0110"),
                    entry("Sofia Reyes", "Fieldnote / CEO", description = "sofia@fieldnote.app\n+1 (510) 555-0147"),
                ),
            ),
        ),
    )
}
