import { use, useCallback, useContext, useEffect, useRef, useState } from "react";
import { addMemberToGroup, createGroup, deleteGroup, editGroup, fetchGroupDetails, getMyContacts, leaveGroup, removeMemberFromGroup } from "../api/requests";
import { ChatType } from "../defaults";
import UserPicture from "./UserPicture";
import { AuthContext } from "../AuthContext";
import ConfirmationDialog from "./ConfirmationDialog";

function GroupDetailsPage({ groupId, close, refetchChats, handleDelete }) {
    const { user, isLoading } = useContext(AuthContext);
    const [groupData, setgroupData] = useState(null);
    const [myContacts, setMyContacts] = useState([]);
    const [removingMembers, setRemovingMembers] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedGroupData, setEditedGroupData] = useState(null);
    const groupNameError = useRef(null);
    const groupDescriptionError = useRef(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);



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
        if (whoChanged.name == "name") {
            if (whoChanged.value.length > 60) {
                groupNameError.current.classList.remove("hidden");
                return;
            } else {
                groupNameError.current.classList.add("hidden");
            }
        }

        if (whoChanged.name == "description") {
            if (whoChanged.value.length > 300) {
                groupDescriptionError.current.classList.remove("hidden");
                return;
            } else {
                groupDescriptionError.current.classList.add("hidden");
            }
        }
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

    async function handleLeaveGroup() {
        const result = await leaveGroup(groupData.id);
        if (result.success) {
            close();
            handleDelete();
        }
    }

    async function handleDeleteGroup() {
        setIsDialogOpen(true);

    }

    const handleConfirmAction = async () => {
        console.log("confirm", groupData)
        const result = await deleteGroup(groupData.id);
        if (result.success) {
            close();
            handleDelete();
        }
    };

    const handleCancelAction = () => {
        setIsDialogOpen(false);
    };

    if (!groupData || !myContacts) return (<><div className="new-group-page"><p className="loading">Loading...</p></div></>)

    console.log(groupData)

    const isOwner = groupData.creatorId == user.id;
    const membersList = groupData.usersGroups.filter((user) => user.user.id != groupData.creatorId).map((user) => { return { id: user.user.id, username: user.user.username } });
    const groupMembers = groupData.usersGroups.map((member) => member.user.id);
    const contactsToAdd = myContacts.filter((contact) => !(groupMembers.includes(contact.contact.id)));



    return (<>
        <div className="new-group-page">
            <div className="group-page-controls">
                <p className="create-group-title">Group Details</p>
                <button onClick={close}>&larr; Back</button>
                {isOwner ? <button onClick={handleEdit}>{isEditing ? "Cancel Edit" : "Edit"}</button> : null}
                {!isOwner ? <button onClick={handleEdit}>Leave group</button> : null}
                {isOwner ? <button onClick={handleDeleteGroup}>Delete group</button> : null}
            </div>
            <div className="new-group-controls">
                {isEditing ? (
                    <>
                        <label htmlFor="name">Group name</label>
                        <input id="name" type="text" name="name" value={editedGroupData.name} onChange={(e) => handleChange(e)} />
                        <p className="error hidden" ref={groupNameError}>Group name length must be between 1 and 60 characters.</p>
                        <label htmlFor="description">Description</label>
                        <input id="description" type="text" name="description" value={editedGroupData.description ?? ""} onChange={(e) => handleChange(e)} />
                        <p className="error hidden" ref={groupDescriptionError}>Group description maximum length is 300 characters.</p>
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
                        membersList.length > 0 ?
                        membersList.map((member) => {
                            return <ContactItem key={member.id}
                                id={member.id}
                                username={member.username}
                                isMember={true}
                                handleChangeMembers={handleChangeMembers}
                                showControls={isOwner} />
                        })
                        :<p>The group has no members</p>
                    ) : (
                        contactsToAdd.length > 0 ? contactsToAdd.map((contact) => {
                            return <ContactItem key={contact.contact.id}
                                id={contact.contact.id}
                                username={contact.contact.username}
                                isMember={false}
                                handleChangeMembers={handleChangeMembers}
                                showControls={isOwner} />
                        }) : <p>No contacts to add</p>
                    )}

            </div>
        </div>
        <ConfirmationDialog
            isOpen={isDialogOpen}
            title="Delete group permanently?"
            message="Are you absolutely sure you want to delete your this group? This action can't be reverted."
            onConfirm={handleConfirmAction}
            onCancel={handleCancelAction}
        />
    </>)
}

function ContactItem({ id, username, handleChangeMembers, isMember, showControls }) {
    return (
        <div className="group-member-item">
            <div className="member-data" onClick={(e) => { }}>
                <UserPicture id={id} type={ChatType.NORMAL} />
                <p className="member-username">{username}</p>
            </div>

            {showControls && <div className="member-controls">
                {isMember ? (<button className="remove-member" onClick={() => handleChangeMembers(id, isMember)}>Remove</button>)
                    : (<button className="add-member" onClick={() => handleChangeMembers(id, isMember)}>Add</button>)}
            </div>}
        </div>);
}

export default GroupDetailsPage;