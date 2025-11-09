# Approach for Modeling Major Requirements

## Problem
Major requirements are hierarchical and have complex constraints:
- Required courses (fixed)
- Elective groups with "pick N from M" rules
- Nested constraints (e.g., "at least 1 from team project list")
- Focus areas with their own requirements
- Credit-based requirements

## Proposed Data Structure

### Core Concepts

#### 1. **Requirement Groups**
Each major is divided into logical groups (e.g., "Technical Core", "Math & Science", "Electives")

#### 2. **Selection Rules**
Define HOW students pick courses from a group:

| Rule Type | Description | Example |
|-----------|-------------|---------|
| `all_required` | Must take all courses | Technical Core: all 11 courses required |
| `pick_n` | Pick exactly N courses | "Choose 2 from {A, B, C, D}" |
| `pick_n_credits` | Pick courses totaling N credits | "18 credits of technical electives" |
| `choice` | Pick 1 from options | "CS 210 OR CS 211" |
| `fill_remaining_credits` | Use remaining credits | Free electives |

#### 3. **Additional Constraints**
Layered on top of selection rules:
- `at_least_one_from`: "At least 1 must be a team project course"
- `focus_area`: "At least 3 must be from same focus area"
- `level_requirement`: "Must be 400-level or higher"
- `grading`: "Must be taken for letter grade"

#### 4. **Focus Areas / Concentrations**
Special groups within electives that have their own course lists

---

## Implementation Strategy

### Phase 1: Manual Parsing (Start Here)
For now, manually parse the Computer Science requirements and create the structured JSON.

**Why?** The HTML structure varies across majors, and requirement language is inconsistent. Manual parsing lets us:
1. Understand all the patterns
2. Create a comprehensive data structure
3. Build the ML model first

### Phase 2: Semi-Automated Extraction
Once we have 5-10 majors manually structured, we can:
1. Identify common HTML patterns
2. Build parsers for specific requirement types
3. Use regex/NLP to extract constraints from text

### Phase 3: Full Automation (Future)
Eventually train a model to extract requirements from text.

---

## For ML Model

### Input Features
With this structure, your ML model can use:
- Course prerequisites (from `all_courses.csv`)
- Required vs elective (from requirement groups)
- Focus areas (student's interests)
- Constraints (what they still need)
- Course difficulty/workload (can add later)

### Output
Recommend courses that:
1. Meet degree requirements
2. Satisfy prerequisites
3. Align with student interests
4. Balance workload across semesters

### Example Query
"I'm a CS major in semester 4. I've completed CS 124, CS 128, CS 173, CS 225, MATH 221, MATH 231. What should I take next?"

Model considers:
- ✅ Prerequisites met: Can now take CS 222, CS 233, CS 374
- ✅ Requirements: Still needs CS 341, CS 357, CS 361, CS 421/422
- ✅ Constraints: Will need to pick electives from focus areas
- 📊 Recommends: CS 233 + CS 374 + MATH 241 (balanced load)

---

## Next Steps

1. **Decide**: Should we manually structure 3-5 major requirements first?
   - Computer Science ✅ (can start from the example)
   - Maybe pick: Business, Liberal Arts, Engineering (variety)

2. **Validate**: Do we have all the constraint types covered?

3. **Build Parser**: Create code to read this JSON structure

4. **Link Data**: Connect with your existing `all_courses.csv` prerequisite data

## Questions for You

1. Do you want to manually structure a few majors first, or try to automate extraction?
2. Should we focus only on technical majors (CS, Engineering) or include all majors?
3. Do you need semester sequencing (which semester to take courses)?
4. Any other constraints? (e.g., co-requisites, time conflicts, professor ratings)
