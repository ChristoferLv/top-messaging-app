import { useEffect, useState } from "react";
import { fetchPicture, getGroupPicture } from "../api/requests";

function UserPicture({ id, type, update }) {
    const [pictureBuff, setPicture] = useState(null);
    const [mime, setMime] = useState(null);
    const rawBuffer = new Uint8Array(pictureBuff);
    const blob = new Blob([rawBuffer], { type: mime });
    const imageUrl = URL.createObjectURL(blob);

    useEffect(() => {
        async function getPicture() {
            if (type == "GROUP") {
                const picture = await getGroupPicture(id);
                setPicture(picture.data.buffer?.data);
                setMime(picture.data.mime);
            } else if (id) {
                const picture = await fetchPicture(id);
                setPicture(picture.data.buffer?.data);
                setMime(picture.data.mime);
            }
        }
        getPicture();
    }, [update, id])

    useEffect(() => {
        return () => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        }
    }, [])
    
    return (
        <>
            <div className="profile-pic user-mini-picture">
                <img src={!pictureBuff ? "../public/avatar.png" :
                    imageUrl} alt="" />
            </div>
        </>
    );
}

export default UserPicture;