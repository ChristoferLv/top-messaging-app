const BASE_URL = "http://localhost:3000"

async function logOut() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.pathname = "/login";
}

async function login(credentials) {
    try {
        const rawResponse = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        return rawResponse;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function getMe() {
    const token = localStorage.getItem("token");
    const meResponse = await fetch('http://localhost:3000/auth/me', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': token
        }
    });
    if (meResponse.status == 200) {
        const meContent = await meResponse.json();
        if (meContent && meContent.success) {
            return meContent;
        }
    } else {
        return null;
    }
}

export {
    login,
    logOut,
    getMe
}