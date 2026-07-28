import { useEffect, useState } from "react";
import { addContact, findUserWithUsername, getMyContacts } from "../api/requests";
import { ChatType } from "../defaults";
import UserPicture from "./UserPicture";

async function loadContacts() {
    const contacts = await getMyContacts();
    return contacts.data;
}

function MyContacts({ closeContactsList, selectUser, createGroup }) {
    const [contactsList, setContactsList] = useState([]);
    const [searchUsername, setSearchUsername] = useState("");
    const [foundContact, setFoundContact] = useState(null);
    const [contactSearched, setContactSearched] = useState(false);
    const [searchedUsername, setSearchedUsername] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function fetchMyContacts() {
            const contacts = await loadContacts();
            setContactsList(contacts);
        }
        fetchMyContacts();
        return () => setContactsList([]);
    }, []);

    function hadleUsername(e) {
        setSearchUsername(e.target.value);
    }

    async function hadleSearchContact(e) {
        e.preventDefault();
        setSearchedUsername(searchUsername);
        setErrorMessage(false);
        const contact = await findUserWithUsername(searchUsername);
        if (contact.success) {
            setFoundContact(contact.data);
            setContactSearched(true);
        } else {
            setFoundContact(null);
            setContactSearched(true);
        }
    }

    async function handleAddContact() {
        const result = await addContact(foundContact.id);
        if (result.success) {
            const contacts = await loadContacts();
            setContactsList(contacts);
        } else {
            setErrorMessage(result.message)
        }
    }



    return (
        <>
            <div className="side-pane">
                <div className="back-btn" onClick={(e) => closeContactsList()}>
                    <div className="icon back-icon"></div>
                    <p>Back</p>
                </div>
                <div className="back-btn" onClick={(e) => createGroup()}>
                    <div className="icon plus-icon"></div>
                    <p>New Group</p>
                </div>
                <div className="chats-space">
                    <div className="new-contact">
                        <p>Add new contact</p>
                        <form onSubmit={hadleSearchContact}>
                            <label htmlFor="">Contact Username</label>
                            <input id="username" type="text" placeholder="Username" onChange={hadleUsername} value={searchUsername} />
                            <button className="search-contact-btn" type="submit">Search User</button>
                        </form>
                        <div className="found-contact">
                            {contactSearched && foundContact && <>
                                <div className="add-contact">
                                    <div className="user-item">
                                        <UserPicture id={foundContact.id} type={ChatType.NORMAL} />
                                        <div className="user-item-data">
                                            <p>Found User: {foundContact.username}</p>
                                        </div>
                                    </div>
                                    <p className="contact-error">{errorMessage}</p>
                                    <button className="add-contact-btn" onClick={handleAddContact}>Add to contact list</button>
                                </div>
                            </>
                            }
                            {contactSearched && !foundContact && <>
                                <p>No contacts found with username {searchedUsername}</p>
                            </>
                            }
                        </div>
                    </div>

                    {contactsList.length > 0 ? contactsList.map((contact) => {
                        return <div key={contact.contact.id} className="user-item" onClick={(e) => selectUser(contact.contact)}>
                            <UserPicture id={contact.contact.id} type={ChatType.NORMAL} />
                            <div className="user-item-data">
                                <p>{contact.contact.id} - {contact.contact.username}</p>
                            </div>
                        </div>
                    }) : <p>No contacts</p>}
                </div>
            </div>
        </>
    );


}



export default MyContacts;