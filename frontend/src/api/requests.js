const BASE_URL = "http://localhost:3000"

async function checkTokenExpired() {
    const token = localStorage.getItem("token");
    try {
        const rawResponse = await fetch('http://localhost:3000/auth/check', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (rawResponse.status == 401) {
            return false;
        } else if (rawResponse.status == 200) {
            return true;
        }
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}

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

async function sendFirstMessage(chatId, data) {
    const formData = new FormData();
    formData.append("midia", data.midia);
    formData.append("message", data.message)
    console.log("first message")
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/chats/${chatId}/messages/first`, {
            method: 'Post',
            body: formData,

            headers: {
                Authorization: token,
            },
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

async function sendMessage(chatId, data) {
    const formData = new FormData();
    formData.append("midia", data.midia);
    formData.append("message", data.message)
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/chats/${chatId}/messages`, {
            method: 'Post',
            body: formData,

            headers: {
                Authorization: token,
            },
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

async function sendGroupMessage(groupId, data) {
    const formData = new FormData();
    formData.append("midia", data.midia);
    formData.append("message", data.message)
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/groups/${groupId}/messages`, {
            method: 'POST',
            body: formData,

            headers: {

                Authorization: token,
            },
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

async function fetchGroupDetails(groupId) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/groups/${groupId}/details`, {
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

async function createGroup(groupData) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/groups/`, {
            method: 'POST',
            body: JSON.stringify(groupData),

            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
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

async function fetchMessagesOfGroup(groupId) {
    console.log("fetching messages of", groupId)
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/groups/${groupId}/messages`, {
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

async function removeMemberFromGroup(groupId, memberId) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/groups/${groupId}/members/${memberId}`, {
            method: 'DELETE',
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

async function addMemberToGroup(groupId, memberId) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/groups/${groupId}/members/${memberId}`, {
            method: 'POST',
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

async function editGroup(groupId, data) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/groups/${groupId}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(data)
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

async function leaveGroup(groupId) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/groups/${groupId}/leave`, {
            method: 'POST',
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

async function deleteGroup(groupId) {
    console.log("delete callded")
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/groups/${groupId}`, {
            method: 'DELETE',
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
        } else {
            return { success: false }
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function findUserById(userId) {
    console.log("Search for", userId)
    try {
        const token = localStorage.getItem("token");
        const request = await fetch("http://localhost:3000/users/" + userId, {
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

async function updateProfile(data) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch("http://localhost:3000/users/", {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(data)
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

async function addContact(contactId) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch("http://localhost:3000/contacts", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ id: contactId })
        });
        if (request.ok) {
            const contact = await request.json();
            return contact;
        } else if (request.status == 400) {
            const result = await request.json();
            return { success: false, message: result.message }
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function sendPicture(data) {
    try {
        const formData = new FormData();
        formData.append("picture", data.picture);
        const token = localStorage.getItem("token");
        const result = await fetch("http://localhost:3000/users/picture/", {

            method: 'Post',
            body: formData,

            headers: {
                Authorization: token,
            },
        })
        const resultData = await result.json();
        return resultData;
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function fetchPicture(userId) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch("http://localhost:3000/users/picture/" + userId, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (request.ok) {
            const picture = await request.json();
            return picture;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}

async function fetchMessageMidia(midiaId, origin) {
    try {
        const token = localStorage.getItem("token");
        const request = await fetch(`http://localhost:3000/midias/${origin}/` + midiaId, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        if (request.ok) {
            const midia = await request.json();
            console.log(midia)
            return midia;
        }
    } catch (e) {
        console.log(e);
        throw e;
    }
}




export {
    checkTokenExpired,
    login,
    logOut,
    getMe,
    fetchAllUsers,
    fetchMyChats,
    checkChatWith,
    sendFirstMessage,
    sendMessage,
    fetchMessagesOfChat,
    sendGroupMessage,
    fetchMessagesOfGroup,
    fetchGroupDetails,
    createGroup,
    removeMemberFromGroup,
    addMemberToGroup,
    editGroup,
    leaveGroup,
    deleteGroup,
    addContact,
    getMyContacts,
    findUserWithUsername,
    findUserById,
    updateProfile,
    sendPicture,
    fetchPicture,
    fetchMessageMidia
}