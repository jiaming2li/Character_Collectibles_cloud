import React, { useState, useEffect, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";

import useHttp from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/contexts/auth-context";
import LoadingSpinner from "../../shared/components/UI/LoadingSpinner/LoadingSpinner";
import ErrorModal from "../../shared/components/UI/ErrorModal/ErrorModal";
import Button from "../../shared/components/FormElements/Button/Button";
import { ENDPOINTS, ASSET_BASE_URL } from "../../config";

import classes from "./PlushPhotos.module.css";

function PlushPhotos() {
  const { plushId } = useParams();
  const history = useHistory();
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttp();
  
  const [plush, setPlush] = useState(null);
  const [allPhotos, setAllPhotos] = useState([]);

  useEffect(() => {
    const fetchPlushAndPhotos = async () => {
      try {
        // Get plush toy information
        const plushData = await sendRequest(
          `${ENDPOINTS.PLUSH}/${plushId}`
        );
        setPlush(plushData.plush);

        // Get all user-shared photos
        const photosData = await sendRequest(
          `${ENDPOINTS.PLUSH_PHOTOS}/${plushId}`
        );
        setAllPhotos(photosData.photos || []);
      } catch (err) {
        console.error("Failed to fetch plush photos:", err);
      }
    };

    fetchPlushAndPhotos();
  }, [sendRequest, plushId]);

  const handleBackToDetail = () => {
    history.push(`/plush/${plushId}/detail`);
  };

  // Generate complete photo array (including default and user-uploaded photos)
  const generatePhotoArray = () => {
    const photos = [];
    
    // Add default image
    if (plush && plush.image) {
      photos.push(`${ASSET_BASE_URL}/${plush.image}`);
    }
    
    // Add user-uploaded images
    allPhotos.forEach(photo => {
      const imageUrl = photo.imageUrl.startsWith('http') 
        ? photo.imageUrl 
        : `${ASSET_BASE_URL}/${photo.imageUrl.replace('uploads/images/', '')}`;
      photos.push(imageUrl);
    });
    
    return photos;
  };

  if (isLoading) {
    return (
      <div className="center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plush) {
    return (
      <div className="center">
        <h2>Plush Toy Not Found</h2>
      </div>
    );
  }

  const photoArray = generatePhotoArray();

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />
      
      <div className={classes.photosPage}>
        {/* Page Header */}
        <div className={classes.header}>
          <Button onClick={handleBackToDetail} inverse>
            ← Back to Details
          </Button>
          <div className={classes.titleSection}>
            <h1 className={classes.title}>{plush.name}</h1>
            <p className={classes.subtitle}>All Photos ({photoArray.length})</p>
          </div>
        </div>

        {/* Photo Grid */}
        <div className={classes.photosGrid}>
          {photoArray.length > 0 ? (
            photoArray.map((photo, index) => (
              <div key={index} className={classes.photoItem}>
                <img
                  src={photo}
                  alt={`${plush.name} - Photo ${index + 1}`}
                  className={classes.photo}
                  onError={(e) => {
                    console.error('Photo load error:', e.target.src);
                    e.target.src = 'https://via.placeholder.com/400x400?text=Load+Failed';
                  }}
                />
                <div className={classes.photoOverlay}>
                  <span className={classes.photoIndex}>#{index + 1}</span>
                  {index === 0 && <span className={classes.photoLabel}>Default Image</span>}
                  {index > 0 && <span className={classes.photoLabel}>User Shared</span>}
                </div>
              </div>
            ))
          ) : (
            <div className={classes.noPhotos}>
              <h3>No Photos Available</h3>
              <p>This plush toy doesn't have any shared photos yet</p>
            </div>
          )}
        </div>

      </div>
    </>
  );
}

export default PlushPhotos;
