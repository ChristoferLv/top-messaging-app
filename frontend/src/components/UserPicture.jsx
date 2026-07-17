import { useEffect, useState } from "react";
import { fetchPicture } from "../api/requests";

function UserPicture({ userId }) {
    const [pictureB64, setPicture] = useState(null);
    const [mime, picture] = pictureB64 ? pictureB64.split(":") : [null, null];

    useEffect(() => {
        async function getPicture() {
            if (userId) {
                const picture = await fetchPicture(userId);
                setPicture(picture.data);
            }
        }
        getPicture();
    }, [userId])

    return (
        <>
            <div className="profile-pic user-mini-picture">
                <img src={!pictureB64 ? "../public/avatar.png" :
                    `data:${mime};base64,${picture}`} alt="" />
            </div>
        </>
    );
}

export default UserPicture;