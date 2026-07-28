import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../AuthContext";
import { fetchPicture, findUserById, sendPicture, updateProfile } from "../api/requests";

function ProfilePage({ userId, close, setUpdate }) {
    const { user, isLoading, setUser } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const fileInputRef = useRef(null);
    const errorMessage = useRef(null);
    const [pictureBuff, setPicture] = useState(null);
    const [mime, setMime] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [editedProfile, setEditedProfile] = useState(null);

    useEffect(() => {
        async function getPicture() {
            if (profile) {
                const picture = await fetchPicture(profile.id);
                setPicture(picture.data.buffer?.data);
                setMime(picture.data.mime);
            }
        }
        getPicture();
    }, [profile])

    useEffect(() => {
        async function getProfile() {
            const profile = await findUserById(userId);
            setProfile(profile.data);
        }
        getProfile();
    }, [userId])

    function handleClickImage(e) {
        fileInputRef.current.click();
    }

    async function handleUploadImage(e) {
        e.target.parentElement.requestSubmit();
    }

    async function handlePictureSubmit(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        fileInputRef.current.value = "";
        if (data.picture.size > 5000000) {
            alert("Maximum picture file size is 5MB.");
            return;
        }

        const result = await sendPicture(data);
        if (result.success) {
            setPicture(result.data.data);
            setUpdate(c => c + 1)
        }
    }

    async function handleEdit() {
        setIsEditing(c => !c);
        setEditedProfile(profile);
    }

    function handleChange(e) {
        const whoChanged = event.target;
        if (whoChanged.name == "note") {
            if (whoChanged.value.length > 120) {
                errorMessage.current.classList.remove("hidden")
                return;
            } else {
                errorMessage.current.classList.add("hidden")
            }
        }
        const newValues = { ...editedProfile, [whoChanged.name]: whoChanged.value }
        setEditedProfile(newValues);
    }

    async function handleSave(e) {
        const result = await updateProfile(editedProfile);
        if (result) {
            setProfile(result.data);
            setIsEditing(false);
        }
    }

    const rawBuffer = new Uint8Array(pictureBuff);
    const blob = new Blob([rawBuffer], { type: mime });
    const imageUrl = URL.createObjectURL(blob);

    if (!profile) return <div className="profile-page"><p className="loading">Loading...</p></div>

    return (<>
        <div className="profile-page">
            <form onSubmit={handlePictureSubmit}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    name="picture"
                    style={{ display: "none" }}
                    onChange={handleUploadImage}
                />
            </form>

            <div className="profile">
                <div className="profile-controls">
                    <button onClick={close}>&larr; Back</button>
                    {isEditing && <button className="save-edit-button" onClick={handleSave}>Save</button>}
                    {userId == user.id ? <button onClick={handleEdit}>{isEditing ? "Cancel Edit" : "Edit"}</button> : null}
                </div>
                <div
                    style={isEditing ? {} : { pointerEvents: "none" }}
                    className="profile-pic" onClick={handleClickImage}
                >
                    <img src={!pictureBuff ? "../public/avatar.png" :
                        imageUrl} alt="" />
                </div>
                <p className="profile-username">{profile.username}</p>
                {isEditing ? (
                    <>
                        <input className="profile-note-input" type="text" name="note" value={editedProfile.note} onChange={(e) => handleChange(e)} />
                        <p ref={errorMessage} className="hidden error">Maximum note length is 120 characters</p>
                    </>
                )
                    : (
                        <>
                            <p className="profile-note">Note: {profile.note}</p>
                        </>
                    )

                }
                <p className="profile-date">Acount created at: <br />{new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    </>);
}



export default ProfilePage;