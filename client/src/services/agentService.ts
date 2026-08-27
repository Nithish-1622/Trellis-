export interface AgentMessageResponse {
    response?: string;
    message?: string;
    content?: string;
}

export const sendMessageToAgent = async (userId: string, message: string, retries = 3, delay = 1000): Promise<string> => {
    for (let i = 0; i < retries; i++) {
        try {
            // const response = await fetch('https://educat.saumyajit.dev/agent/message', {
            const response = await fetch(`${API_BASE_URL}/agent/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    message: message
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                let errorMessage = `Network response was not ok: ${response.status} ${response.statusText}`;
                try {
                    const jsonError = JSON.parse(errorData);
                    if (jsonError.detail) {
                        errorMessage = jsonError.detail;
                    } else {
                        errorMessage = `Server Error: ${JSON.stringify(jsonError)}`;
                    }
                } catch (e) {
                    errorMessage = `Server Error: ${errorData}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            const aiText = data.response || data.message || data.content || JSON.stringify(data);
            return aiText;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) {
                console.error('All retries failed.');
                throw error;
            }
            // Wait before next retry
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Failed to send message after retries");
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085';

export const parseResume = async (userId: string, file: File, fileId?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    if (fileId) {
        formData.append('resume_file_id', fileId);
    }

    const response = await fetch(`${API_BASE_URL}/agent/resume/parse?user_id=${userId}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to parse resume: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.json();
};

export const recommendJobs = async (userId: string, limit: number = 5): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/agent/jobs/recommend`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            limit: limit
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to get job recommendations: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.json();
};

export const getLearningResources = async (skill: string, level: string = 'Beginner', resourceTypes: string[] = ['course', 'tutorial', 'video', 'project']): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/agent/resources/learning`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            skill: skill,
            level: level,
            resource_types: resourceTypes
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to get learning resources: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.json();
};

export const getCurrentRoadmap = async (userId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/agent/roadmap/current?user_id=${userId}`);

    if (response.status === 404) {
        return { milestones: [] }; // Return empty structure for new users
    }

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to get current roadmap: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.json();
};

export const regenerateRoadmap = async (userId: string, focusArea: string = "AI Engineering", activeHoursPerWeek: number = 10, currentLevel: string = "intermediate"): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/agent/roadmap/regenerate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            focus_area: focusArea,
            active_hours_per_week: activeHoursPerWeek,
            current_level: currentLevel
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to regenerate roadmap: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.json();
};

export const getMemorySummary = async (userId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/agent/memory/summary?user_id=${userId}`);

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to get memory summary: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.json();
};

// Interview Services
export const startInterview = async (userId: string, targetRole: string, focusArea: string = "General"): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/agent/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            target_role: targetRole,
            focus_area: focusArea,
            difficulty: "intermediate"
        })
    });
    if (!response.ok) throw new Error("Failed to start interview");
    return await response.json();
};

export const submitInterviewAnswer = async (userId: string, sessionId: string, answer: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/agent/interview/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            session_id: sessionId,
            answer: answer
        })
    });
    if (!response.ok) throw new Error("Failed to submit answer");
    return await response.json();
};

export const getInterviewReport = async (sessionId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/agent/interview/report/${sessionId}`);
    if (!response.ok) throw new Error("Failed to get report");
    return await response.json();
};


