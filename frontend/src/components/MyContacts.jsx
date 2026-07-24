import { useEffect, useState } from "react";
import { addContact, findUserWithUsername, getMyContacts } from "../api/requests";

async function loadContacts() {
    const contacts = await getMyContacts();
    console.log(contacts)
    return contacts.data;
}

function MyContacts({ closeContactsList, selectUser, createGroup }) {
    const [contactsList, setContactsList] = useState([]);
    const [showAddContact, setShowAddContact] = useState(false);
    const [searchUsername, setSearchUsername] = useState("");
    const [foundContact, setFoundContact] = useState(null);
    const [contactSearched, setContactSearched] = useState(false);
    const [searchedUsername, setSearchedUsername] = useState("");

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
        const contact = await findUserWithUsername(searchUsername);
        console.log(contact)
        if (contact.success) {
            setFoundContact(contact.data);
            setContactSearched(true);
        } else {
            setFoundContact(null);
            setContactSearched(true);
        }
    }

    async function handleAddContact() {
        const result = await addContact(searchUsername);
        console.log(result)
        if (result.success) {
            const contacts = await loadContacts();
            setContactsList(contacts);
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
                <div className="new-contact">
                    <p>Add new contact</p>
                    <form onSubmit={hadleSearchContact}>
                        <label htmlFor="">Contact Username</label>
                        <input id="username" type="text" placeholder="Username" onChange={hadleUsername} value={searchUsername} />
                        <button type="submit">Search User</button>
                    </form>
                    <div className="found-contact">
                        {contactSearched && foundContact && <>
                            <div className="add-contact">
                                <p>Found User: {foundContact.username}</p>
                                <button onClick={handleAddContact}>Add to contact list</button>
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
                    return <div key={contact.contact.id} className="user-item" onClick={(e) => { selectUser(contact.contact) }}>
                        <p>{contact.contact.id} - {contact.contact.username}</p>
                    </div>
                }) : <p>No contacts</p>}
            </div>
        </>
    );


}



export default MyContacts;