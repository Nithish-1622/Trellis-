export interface Question {
    id: number
    text: string
    keyword: string
    options: string[]
}

export const questions: Question[] = [
    {
        id: 1,
        text: 'What field interests you the most?',
        keyword: 'Interest',
        options: ['Software Development', 'Data Science', 'Design', 'Product Management', 'Marketing'],
    },
    {
        id: 2,
        text: 'How do you prefer to solve problems?',
        keyword: 'Work Style',
        options: ['Analyzing data', 'Writing code', 'Visualizing solutions', 'Leading teams', 'Communicating ideas'],
    },
    {
        id: 3,
        text: 'What is your preferred work environment?',
        keyword: 'Environment',
        options: ['Remote', 'Office', 'Hybrid', 'Outdoor'],
    },
    {
        id: 4,
        text: 'What are your strongest skills?',
        keyword: 'Top Skill',
        options: ['Logic & Math', 'Creativity', 'Communication', 'Organization', 'Leadership'],
    },
    {
        id: 5,
        text: 'What is your long-term career goal?',
        keyword: 'Goal',
        options: ['Founder/Entrepreneur', 'Technical Expert', 'Corporate Leader', 'Freelancer', 'Researcher'],
    },
]
