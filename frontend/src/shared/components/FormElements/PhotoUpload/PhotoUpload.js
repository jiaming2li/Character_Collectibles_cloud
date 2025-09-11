import React, { useState, useRef, useEffect } from "react";

import Button from "../Button/Button";
import Modal from "../../UI/Modal/Modal";
import LoadingSpinner from "../../UI/LoadingSpinner/LoadingSpinner";

import classes from "./PhotoUpload.module.css";

function PhotoUpload({ onUpload, isLoading, show, onCancel }) {
  const [file, setFile] = useState();
  const [previewUrl, setPreviewUrl] = useState();
  const [description, setDescription] = useState("");
  const [isValid, setIsValid] = useState(false);
  const filePickerRef = useRef();

  function pickImageHandler() {
    filePickerRef.current.click();
  }

  function pickedHandler(event) {
    let pickedFile;
    let fileIsValid = isValid;

    if (event.target.files && event.target.files.length === 1) {
      pickedFile = event.target.files[0];
      
      // Check file size (limit to 5MB)
      if (pickedFile.size > 5 * 1024 * 1024) {
        alert("File size cannot exceed 5MB");
        return;
      }

      setFile(pickedFile);
      setIsValid(true);
      fileIsValid = true;
    } else {
      setIsValid(false);
      fileIsValid = false;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    
    if (!file || !isValid) {
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('description', description);

    onUpload(formData);
  }

  function handleCancel() {
    setFile(null);
    setPreviewUrl(null);
    setDescription("");
    setIsValid(false);
    onCancel();
  }

  useEffect(() => {
    if (!file) {
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  }, [file]);

  const modalContent = (
    <form onSubmit={handleSubmit} className={classes.photoUploadForm}>
      <div className={classes.formGroup}>
        <input
          ref={filePickerRef}
          style={{ display: "none" }}
          type="file"
          accept=".jpg,.png,.jpeg"
          onChange={pickedHandler}
        />
        
        <div className={classes.imageUploadSection}>
          <div className={classes.imagePreview}>
            {previewUrl && <img src={previewUrl} alt="Preview" />}
            {!previewUrl && <p>Please select an image to upload</p>}
          </div>
          <Button type="button" onClick={pickImageHandler} size="small">
            Select Image
          </Button>
        </div>
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="description">Image Description (Optional)</label>
        <textarea
          id="description"
          rows="3"
          maxLength="500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description for this image..."
          className={classes.textArea}
        />
        <small className={classes.charCount}>
          {description.length}/500
        </small>
      </div>

      <div className={classes.buttonGroup}>
        <Button type="button" onClick={handleCancel} inverse>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!isValid || isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : "Upload"}
        </Button>
      </div>
    </form>
  );

  return (
    <Modal
      show={show}
      onCancel={handleCancel}
      header="Upload Photo"
      contentClass={classes.modalContent}
      footerClass={classes.modalFooter}
    >
      {modalContent}
    </Modal>
  );
}

export default PhotoUpload;
