import re
from typing import List, Dict

# Master skill vocabulary mapping: Canonical Skill Name -> List of aliases/variations (lowercase)
SKILL_VOCABULARY: Dict[str, List[str]] = {
    "Python": ["python", "py"],
    "Java": ["java"],
    "JavaScript": ["javascript", "js", "ecmascript"],
    "TypeScript": ["typescript", "ts"],
    "C": ["c"],
    "C++": ["c++", "cpp", "c plus plus"],
    "C#": ["c#", "c-sharp", "csharp"],
    "SQL": ["sql", "structured query language"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "React": ["react", "react.js", "reactjs", "react native"],
    "Node.js": ["node.js", "nodejs", "node"],
    "FastAPI": ["fastapi", "fast api"],
    "Flask": ["flask"],
    "Django": ["django"],
    "Spring": ["spring", "spring boot", "springboot"],
    "Docker": ["docker", "containerization"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure", "microsoft azure"],
    "Git": ["git"],
    "GitHub": ["github"],
    "Linux": ["linux", "ubuntu", "debian", "centos", "redhat"],
    "MySQL": ["mysql"],
    "PostgreSQL": ["postgresql", "postgres", "postgre"],
    "MongoDB": ["mongodb", "mongo"],
    "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning", "dl"],
    "NLP": ["nlp", "natural language processing"],
    "TensorFlow": ["tensorflow", "tf"],
    "PyTorch": ["pytorch"],
    "scikit-learn": ["scikit-learn", "sklearn"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Express.js": ["express", "express.js", "expressjs"],
    "Vue.js": ["vue", "vue.js", "vuejs"],
    "Angular": ["angular", "angularjs"],
    "REST API": ["rest api", "restful api", "rest apis", "rest"],
    "GraphQL": ["graphql"],
    "Redis": ["redis"],
    "Kafka": ["kafka", "apache kafka"],
    "CI/CD": ["ci/cd", "ci-cd", "continuous integration"],
    "Jira": ["jira"],
    "Problem Solving": ["problem solving"],
    "Agile": ["agile", "scrum"],
    "PHP": ["php"],
    "Ruby": ["ruby", "ruby on rails", "rails"],
    "Swift": ["swift"],
    "Kotlin": ["kotlin"],
    "Go": ["golang", "go"]
}


def normalize_skill(raw_skill: str) -> str:
    """
    Normalizes raw skill string against master vocabulary.
    Returns canonical skill name if matched, else returns title-cased string.
    """
    clean_skill = raw_skill.strip().lower()
    for canonical, aliases in SKILL_VOCABULARY.items():
        if clean_skill in aliases or clean_skill == canonical.lower():
            return canonical
    return raw_skill.strip().title()


def extract_skills_from_text(text: str) -> List[str]:
    """
    Extracts recognized skills from text using word-boundary pattern matching.
    Avoids false positives for short skill names like 'C' or 'Go'.
    """
    if not text:
        return []

    found_skills = set()
    text_lower = text.lower()

    for canonical, aliases in SKILL_VOCABULARY.items():
        for alias in aliases:
            # Handle special characters in regex (like C++, C#, .js, etc.)
            escaped_alias = re.escape(alias)
            
            # Word boundary regex depending on special chars
            if alias in ["c", "go", "ts", "js", "py", "ml", "dl", "nlp"]:
                # Strict word boundaries for short 1-2 char terms
                pattern = r'(?:\b|(?<=\s))' + escaped_alias + r'(?:\b|(?=\s)|(?=[.,;\n]))'
            else:
                pattern = r'(?:\b|(?<=\s))' + escaped_alias + r'(?:\b|(?=\s)|(?=[.,;\n]))'
            
            if re.search(pattern, text_lower):
                found_skills.add(canonical)
                break

    return sorted(list(found_skills))
