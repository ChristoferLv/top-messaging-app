import { useEffect, useState } from "react";
import { fetchPicture } from "../api/requests";

function UserPicture({ id, type }) {
    const [pictureB64, setPicture] = useState(null);
    const [mime, picture] = pictureB64 ? pictureB64.split(":") : [null, null];
    useEffect(() => {
        async function getPicture() {
            if (type == "GROUP"){
                return;
            }
            if (id) {
                const picture = await fetchPicture(id);
                setPicture(picture.data);
            }
        }
        getPicture();
    }, [id, type])

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