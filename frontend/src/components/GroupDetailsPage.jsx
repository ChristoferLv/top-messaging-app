import { use, useCallback, useContext, useEffect, useState } from "react";
import { addMemberToGroup, createGroup, editGroup, fetchGroupDetails, getMyContacts, removeMemberFromGroup } from "../api/requests";
import { ChatType } from "../defaults";
import UserPicture from "./UserPicture";
import { AuthContext } from "../AuthContext";

function GroupDetailsPage({ groupId, close, refetchChats }) {
    const { user, isLoading } = useContext(AuthContext);
    const [groupData, setgroupData] = useState(null);
    const [myContacts, setMyContacts] = useState([]);
    const [removingMembers, setRemovingMembers] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedGroupData, setEditedGroupData] = useState(null);


    const fetchGroupData = useCallback(async () => {
        const details = await fetchGroupDetails(groupId);
        if (details) {
            setgroupData(details.data);
        }
    }, []);

    useEffect(() => {
        async function getContacts() {
            const contacts = await getMyContacts();
            if (contacts) {
                setMyContacts(contacts.data);
            }
        }

        getContacts();

        return () => setMyContacts([]);
    }, [groupData]);

    useEffect(() => {
        fetchGroupData();

        return () => setgroupData(null);
    }, []);

    function handleChange(e) {
        const whoChanged = event.target;
        const newValues = { ...editedGroupData, [whoChanged.name]: whoChanged.value }
        setEditedGroupData(newValues);
    }

    async function handleEdit() {
        setIsEditing(c => !c);
        setEditedGroupData({ name: groupData.name, description: groupData.description });
    }

    async function handleSaveEdit() {
        const result = await editGroup(groupData.id, editedGroupData);
        if (result) {
            setIsEditing(false);
            fetchGroupData();
            refetchChats();
        }
    }

    async function handleChangeMembers(id, isMember) {
        if (isMember) {
            const result = await removeMemberFromGroup(groupData.id, id);
            if (result) {
                fetchGroupData();
            }
            return;
        }
        const result = await addMemberToGroup(groupData.id, id);
        if (result) {
            fetchGroupData();
        }
    }

    function handleToggleMembersManage() {
        setRemovingMembers(c => !c);
    }

    if (!groupData || !myContacts) return (<><div className="new-group-page"><p className="loading">Loading...</p></div></>)

    const isOwner = groupData.creatorId == user.id;
    const groupMembers = groupData.usersGroups.map((member) => member.user.id);
    const contactsToAdd = myContacts.filter((contact) => !(groupMembers.includes(contact.contact.id)));



    return (<>
        <div className="new-group-page">
            <div className="group-page-controls">
                <p className="create-group-title">Group Details</p>
                <button onClick={close}>&larr; Back</button>
                {isOwner ? <button onClick={handleEdit}>{isEditing ? "Cancel Edit" : "Edit"}</button> : null}
            </div>
            <div className="new-group-controls">
                {isEditing ? (
                    <>
                        <label htmlFor="name">Group name</label>
                        <input id="name" type="text" name="name" value={editedGroupData.name} onChange={(e) => handleChange(e)} />
                        <label htmlFor="description">Description</label>
                        <input id="description" type="text" name="description" value={editedGroupData.description ?? ""} onChange={(e) => handleChange(e)} />
                    </>
                )
                    : (
                        <>
                            <p className="group-name">Group name: {groupData.name}</p>
                            <p className="group-description">Description: {groupData.description ?? "No description"}</p>
                        </>
                    )

                }

                {isEditing && <button className="create-group-btn" onClick={handleSaveEdit}>Save</button>}
                {isOwner ?
                    (<p className="members-selection">Members management: {removingMembers ? "Current members" : "Adding"}</p>)
                    : (<p className="members-selection">Members:</p>)}

                {isOwner && <div className="manage-members-controls">
                    {<button className={removingMembers ? "inactive" : {}} onClick={handleToggleMembersManage}>Current members</button>}
                    {<button className={`remove ${removingMembers ? {} : "inactive"}`} onClick={handleToggleMembersManage}>Add members</button>}
                </div>}
                {removingMembers ?

                    (
                        groupData.usersGroups.map((member) => {
                            return <ContactItem key={member.user.id}
                                id={member.user.id}
                                username={member.user.username}
                                isMember={true}
                                handleChangeMembers={handleChangeMembers} />
                        })
                    ) : (
                        contactsToAdd.length > 0 ? contactsToAdd.map((contact) => {
                            return <ContactItem key={contact.contact.id}
                                id={contact.contact.id}
                                username={contact.contact.username}
                                isMember={false}
                                handleChangeMembers={handleChangeMembers} />
                        }) : <p>No contacts to add</p>
                    )}

            </div>
        </div>
    </>)
}

function ContactItem({ id, username, handleChangeMembers, isMember, showControls }) {
    return (
        <div className="group-member-item">
            <div className="member-data" onClick={(e) => { }}>
                <UserPicture id={id} type={ChatType.NORMAL} />
                <p>{username}</p>
            </div>

            {showControls && <div className="member-controls">
                {isMember ? (<button className="remove-member" onClick={() => handleChangeMembers(id, isMember)}>Remove</button>)
                    : (<button className="add-member" onClick={() => handleChangeMembers(id, isMember)}>Add</button>)}
            </div>}
        </div>);
}

export default GroupDetailsPage;