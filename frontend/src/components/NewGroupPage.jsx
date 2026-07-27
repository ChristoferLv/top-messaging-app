import { useEffect, useRef, useState } from "react";
import { createGroup, getMyContacts } from "../api/requests";
import { ChatType } from "../defaults";
import UserPicture from "./UserPicture";

function NewGroupPage({ close, refetchChats }) {
    const [myContacts, setMyContacts] = useState([]);
    const [groupData, setgroupData] = useState({ name: "", description: "", members: [] });
    const groupNameError = useRef(null);
    const groupDescriptionError = useRef(null);

    useEffect(() => {
        async function getContacts() {
            const contacts = await getMyContacts();
            if (contacts) {
                setMyContacts(contacts.data);
            }
        }

        getContacts();

        return () => setMyContacts([]);
    }, []);

    async function handleChange(e) {
        const whoChanged = event.target;
        if (whoChanged.name == "name") {
            if (whoChanged.value.length > 40) {
                groupNameError.current.classList.remove("hidden");
                return;
            } else {
                groupNameError.current.classList.add("hidden");
            }
        }

        if (whoChanged.name == "description") {
            if (whoChanged.value.length > 250) {
                groupDescriptionError.current.classList.remove("hidden");
                return;
            } else {
                groupDescriptionError.current.classList.add("hidden");
            }
        }
        const newValues = { ...groupData, [whoChanged.name]: whoChanged.value }
        setgroupData(newValues);
    }

    async function handleChangeMembers(id, isMember) {
        if (isMember) {
            const newMembers = groupData.members.filter((member) => member != id);
            setgroupData({ ...groupData, members: newMembers });
            return;
        }
        const newMembers = [...groupData.members, id];
        setgroupData({ ...groupData, members: newMembers });
    }

    async function handleCreateGroup() {
        const result = await createGroup(groupData);
        if (result) {
            refetchChats();
            close();
        }
    }

    if (!myContacts) return (<><div className="new-group-page"><p className="loading">Loading...</p></div></>)
    return (<>
        <div className="new-group-page">
            <p className="create-group-title">Create new Group</p>
            <div className="new-group-controls">
                <label htmlFor="name">Group name*</label>
                <input id="name" type="text" name="name" value={groupData.name} onChange={(e) => handleChange(e)} />
                <p className="error hidden" ref={groupNameError}>Group name length must be between 1 and 60 characters.</p>
                <label htmlFor="description">Description</label>
                <input id="description" type="text" name="description" value={groupData.description} onChange={(e) => handleChange(e)} />
                <p className="error hidden" ref={groupDescriptionError}>Group description maximum length is 300 characters.</p>
                <button className="create-group-btn" onClick={handleCreateGroup}>Create</button>
                <p className="members-selection">Members selection</p>
                {myContacts.length > 0 ? myContacts.map((contact) => {
                    return <ContactItem key={contact.contact.id}
                        id={contact.contact.id}
                        username={contact.contact.username}
                        isMember={groupData.members.includes(contact.contact.id)}
                        handleChangeMembers={handleChangeMembers} />
                }) : <p>No contacts</p>}
            </div>
        </div>
    </>)
}

function ContactItem({ id, username, handleChangeMembers, isMember }) {
    return (
        <div className="group-member-item">
            <div className="member-data" onClick={(e) => { }}>
                <UserPicture id={id} type={ChatType.NORMAL} />
                <p>{username}</p>
            </div>
            <div className="member-controls">
                {isMember ? (<button className="remove-member" onClick={() => handleChangeMembers(id, isMember)}>Remove</button>)
                    : (<button className="add-member" onClick={() => handleChangeMembers(id, isMember)}>Add</button>)}
            </div>
        </div>);
}

export default NewGroupPage;