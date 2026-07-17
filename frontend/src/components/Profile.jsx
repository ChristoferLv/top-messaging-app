import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../AuthContext";
import { fetchPicture, sendPicture } from "../api/requests";

function ProfilePage() {
    const { user, isLoading } = useContext(AuthContext);
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);
    const [pictureB64, setPicture] = useState(null);
    const [mime, picture] = pictureB64 ? pictureB64.split(":") : [null, null];

    useEffect(() => {
        async function getPicture() {
            if (user) {
                const picture = await fetchPicture(user.id);
                setPicture(picture.data);
            }
        }
        getPicture();
    }, [user])

    function handleClickImage(e) {
        fileInputRef.current.click();
    }

    async function handleUploadImage(e) {
        e.target.parentElement.requestSubmit();
    }

    async function handlePictureSubmit(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const result = await sendPicture(data);
        if (result) {
            setPicture(result.data);
        }
    }


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
                <div className="profile-pic" onClick={handleClickImage}
                >
                    <img src={!pictureB64 ? "../public/avatar.png" :
                        `data:${mime};base64,${picture}`} alt="" />
                </div>
                <p className="profile-username">{user.username}</p>
                <p className="profile-date">Acount created at: <br />{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    </>);
}



export default ProfilePage;