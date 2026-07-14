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


async function fetchAllUsers() {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch('http://localhost:3000/users', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (request.status == 200) {
            const users = await request.json();
            console.log(users)
            return users;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function fetchMyChats() {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch('http://localhost:3000/chats/mine', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (request.status == 200) {
            const chatsData = await request.json();
            console.log(chatsData)
            return chatsData;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function checkChatWith(userId) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch('http://localhost:3000/chats/chatWith/' + userId, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (request.status == 200) {
            const chatData = await request.json();
            return chatData;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function sendFirstMessage(chatId, message) {
    console.log("first message")
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/chats/${chatId}/messages/first`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ message: message })
        });
        if (request.ok) {
            const chatData = await request.json();
            return chatData;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function sendMessage(chatId, message) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/chats/${chatId}/messages`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ message: message })
        });
        if (request.ok) {
            const chatData = await request.json();
            return chatData;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function fetchMessagesOfChat(chatId) {
    console.log("fetching messages of", chatId)
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/chats/${chatId}/messages`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (request.ok) {
            const messages = await request.json();
            return messages;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function findUserWithUsername(username) {
    console.log("Search for", username)
    try {
        const token = localStorage.getItem("token");
        const request = await fetch("http://localhost:3000/users/find/" + username, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (request.ok) {
            const user = await request.json();
            return user;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function getMyContacts() {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch("http://localhost:3000/contacts", {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (request.ok) {
            const contacts = await request.json();
            return contacts;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function addContact(contactUsername) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch("http://localhost:3000/contacts", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ username: contactUsername })
        });
        if (request.ok) {
            const contact = await request.json();
            return contact;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}


export {
    login,
    logOut,
    getMe,
    fetchAllUsers,
    fetchMyChats,
    checkChatWith,
    sendFirstMessage,
    sendMessage,
    fetchMessagesOfChat,
    addContact,
    getMyContacts,
    findUserWithUsername
}