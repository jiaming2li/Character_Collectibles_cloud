import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../shared/components/FormElements/Button/Button";
import Card from "../../../shared/components/UI/Card/Card";
import Modal from "../../../shared/components/UI/Modal/Modal";
import ErrorModal from "../../../shared/components/UI/ErrorModal/ErrorModal";
import LoadingSpinner from "../../../shared/components/UI/LoadingSpinner/LoadingSpinner";

import useHttp from "../../../shared/hooks/http-hook";
import { AuthContext } from "../../../shared/contexts/auth-context";
import { ENDPOINTS, API_BASE_URL, ASSET_BASE_URL } from "../../../config.js";

import classes from "./PlaceItem.module.css";

function PlaceItem(props) {
  const { isLoading, error, sendRequest, clearError } = useHttp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const authContext = useContext(AuthContext);



  function toggleShowDeleteModalHandler() {
    setShowDeleteModal(!showDeleteModal);
  }



  async function deleteHandler() {
    setShowDeleteModal(false);

    try {
      await sendRequest(
        `${ENDPOINTS.PLUSH}/${props.id}`,
        "DELETE",
        null,
        {
          Authorization: `Bearer ${authContext.token}`,
        }
      );

      props.onDelete(props.id);
    } catch (error) {
      console.log(error);
    }
  }

  function handleLike() {
    props.onLike(props.id, !props.likes?.includes(authContext.userId));
  }

  function handleRemoveFromList() {
    if (props.onRemoveFromList) {
      props.onRemoveFromList(props.id);
    }
  }

  function handleWishlistAdd() {
    props.onWishlistAdd(props.id);
  }

  function handleImageError() {
    setImageError(true);
  }

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />
      
      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onCancel={toggleShowDeleteModalHandler}
        header="Are you sure?"
        footerClass="place-item__modal-actions"
        footer={
          <>
            <Button onClick={toggleShowDeleteModalHandler} inverse>
              Cancel
            </Button>
            <Button onClick={deleteHandler} danger>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ margin: "1rem" }}>
          Are you sure you want to delete this plush? This action cannot be
          undone!
        </p>
      </Modal>



      <li className={classes["place-item"]}>
        <Card className={classes["place-item__content"]}>
          {isLoading && <LoadingSpinner asOverlay />}
          <div className={classes["place-item__image"]}>
            {imageError ? (
              <div className={classes["image-placeholder"]}>
                <div className={classes["placeholder-icon"]}>📷</div>
                <div className={classes["placeholder-text"]}>No Image</div>
              </div>
            ) : (
              <img
                src={/^https?:\/\//.test(props.image) ? props.image : `${ASSET_BASE_URL}/${props.image}`}
                alt={props.name}
                onError={handleImageError}
              />
            )}
          </div>
          <div className={classes["place-item__info"]}>
            <Link to={`/plush/${props.id}/detail`} className={classes["plush-name-link"]}>
              <h2 className={classes["plush-name"]}>{props.name}</h2>
            </Link>
            <p className={classes["plush-description"]}>{props.description}</p>
          </div>
          {!props.profileView && (
            <div className={classes["place-item__actions"]}>
              {authContext.userId === props.creatorId && (
                <>
                  <Button to={`/plush/${props.id}`}>Edit</Button>
                  <Button onClick={toggleShowDeleteModalHandler} danger>
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
          {props.profileView && props.onRemoveFromList && (
            <div className={classes["place-item__actions"]}>
              <Button onClick={handleRemoveFromList}>
                Remove
              </Button>
            </div>
          )}
        </Card>
      </li>
    </>
  );
}

export default PlaceItem;
