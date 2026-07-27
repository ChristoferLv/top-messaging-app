import { useEffect, useState } from "react";
import { fetchPicture } from "../api/requests";

function UserPicture({ id, type }) {
    const [pictureB64, setPicture] = useState(null);
    const [mime, setMime] = useState(null);

    useEffect(() => {
        async function getPicture() {
            if (type == "GROUP") {
                return;
            }
            if (id) {
                const picture = await fetchPicture(id);
                setPicture(picture.data.buffer?.data);
                setMime(picture.data.mime);
            }
        }
        getPicture();
    }, [id, type])

    const rawBuffer = new Uint8Array(pictureB64);
    const blob = new Blob([rawBuffer], { type: mime });
    const imageUrl = URL.createObjectURL(blob);
    return (
        <>
            <div className="profile-pic user-mini-picture">
                <img src={!pictureB64 ? "../public/avatar.png" :
                    imageUrl} alt="" />
            </div>
        </>
    );
}

export default UserPicture;