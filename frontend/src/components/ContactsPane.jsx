import { useEffect, useState } from "react";
import UserPicture from "./UserPicture";
import { ChatType } from "../defaults";
import MyContacts from "./MyContacts";

function ContactsPane({ user, chatsList, logout, update, selectUser, createGroup, seeUserProfile }) {
    const [sidePane, setSidePane] = useState(false);

    function handleToggleSidePane() {
        setSidePane(c => !c);
    }

    function handleSelecUser(newChat){
        setSidePane(false);
        selectUser(newChat);
    }

    function handleCreateGroup(){
        setSidePane(false);
        createGroup();
    }

    return (
        sidePane ? <MyContacts closeContactsList={handleToggleSidePane} selectUser={handleSelecUser} createGroup={handleCreateGroup} />
            :
            <div className="side-pane">
                <div className="logout-btn" onClick={logout}>
                    <div className="icon logout-icon"></div>
                    <p>Log out</p>
                </div>
                <div className="main-header">
                    <p className="app-title">WhatsUp</p>
                    <div className="profile-btn" onClick={() => seeUserProfile(user.id)}>
                        <UserPicture id={user.id} type={"NORMAL"} update={update}/>
                        <p className="greetings">Hello {user.username}</p>
                    </div>
                    <div onClick={(e) => handleToggleSidePane()} className="new-chat-btn">
                        <p>New Chat</p>
                        <div className="icon new-chat-icon"></div>
                    </div>
                </div>
                <div className="chats-space">
                    {chatsList.length > 0 ? chatsList.map((chatItem) => {
                        if (chatItem.chatType == ChatType.GROUP)
                            return <div key={`${chatItem.chatType}-${chatItem.groupId}`} className="user-item" onClick={(e) => selectUser(chatItem)}>
                                <UserPicture id={chatItem.groupId} type={chatItem.chatType} update={update}/>
                                <div className="user-item-data">
                                    <p className="chat-title">{chatItem.username}</p>
                                    {chatItem.lastMessage != null ?
                                        <p>{chatItem.lastMessage.senderId == user.id ? "You" : chatItem.lastMessage.sender.username}: {chatItem.lastMessage.content}</p>
                                        : <p>Group Created</p>
                                    }
                                    <p>{new Date(chatItem.updated_at).toLocaleString()}</p>
                                </div>
                            </div>
                        return <div key={`${chatItem.chatType}-${chatItem.id}`} className="user-item" onClick={(e) => selectUser(chatItem)}>
                            <UserPicture id={chatItem.id} type={chatItem.chatType} isOnline={chatItem.isOnline}/>
                            <div className="user-item-data">
                                <p className="chat-title">{chatItem.username}</p>
                                <p>{chatItem.lastMessage?.senderId == user.id ? "You" : chatItem.username}: {chatItem.lastMessage?.content}</p>
                                <p>{new Date(chatItem.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    }) : <p>No users</p>}
                </div>
            </div>
    )
}
    



export default ContactsPane;