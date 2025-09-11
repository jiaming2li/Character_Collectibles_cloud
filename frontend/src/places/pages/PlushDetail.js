import React, { useState, useEffect, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";

import Button from "../../shared/components/FormElements/Button/Button";
import Modal from "../../shared/components/UI/Modal/Modal";
import ErrorModal from "../../shared/components/UI/ErrorModal/ErrorModal";
import LoadingSpinner from "../../shared/components/UI/LoadingSpinner/LoadingSpinner";
import PhotoUpload from "../../shared/components/FormElements/PhotoUpload/PhotoUpload";
import useHttp from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/contexts/auth-context";
import { ENDPOINTS, API_BASE_URL, ASSET_BASE_URL } from "../../config";

import classes from "./PlushDetail.module.css";

function PlushDetail() {
  const { plushId } = useParams();
  const history = useHistory();
  const authContext = useContext(AuthContext);
  
  // Debug logging
  console.log('[PlushDetail] Component mounted');
  console.log('[PlushDetail] plushId from useParams:', plushId);
  console.log('[PlushDetail] Current location:', window.location.href);
  const { isLoading, error, sendRequest, clearError } = useHttp();
  const [plush, setPlush] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [userCustomLists, setUserCustomLists] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [userUploadedPhotos, setUserUploadedPhotos] = useState([]);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [allUserPhotos, setAllUserPhotos] = useState([]);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showSimpleModal, setShowSimpleModal] = useState(false);
  const [simpleModalMessage, setSimpleModalMessage] = useState("");

  // Get current user information
  useEffect(() => {
    const fetchCurrentUserInfo = async () => {
      if (authContext.userId && authContext.token) {
        try {
          const response = await sendRequest(
            `${ENDPOINTS.USERS}/${authContext.userId}`,
            "GET",
            null,
            {
              Authorization: "Bearer " + authContext.token,
            }
          );
          setCurrentUserInfo(response.user);
        } catch (error) {
          console.error("Error fetching current user info:", error);
        }
      }
    };

    fetchCurrentUserInfo();
  }, [authContext.userId, authContext.token, sendRequest]);

  // Get all user photos uploaded for this plush
  useEffect(() => {
    async function fetchAllUserPhotos() {
      if (!plushId) return;
      
      try {
        console.log('Fetching all user photos for plushId:', plushId);
        console.log('API endpoint:', `${ENDPOINTS.PLUSH_PHOTOS}/${plushId}`);
        
        const response = await sendRequest(
          `${ENDPOINTS.PLUSH_PHOTOS}/${plushId}`
        );
        
        console.log('All user photos response:', response);
        setAllUserPhotos(response.photos || []);
      } catch (error) {
        console.error('Error fetching all user photos:', error);
        setAllUserPhotos([]);
      }
    }

    fetchAllUserPhotos();
  }, [plushId, sendRequest]);

  // Get current user photos uploaded for this plush
  useEffect(() => {
    async function fetchUserPhotos() {
      if (!plushId || !authContext.userId) {
        console.log('Skipping user photos fetch - missing plushId or userId');
        setUserUploadedPhotos([]);
        return;
      }
      
      try {
        console.log('Fetching user photos for plushId:', plushId, 'userId:', authContext.userId);
        
        const response = await sendRequest(
          `${ENDPOINTS.PLUSH_PHOTOS}/${plushId}/user/${authContext.userId}`
        );
        
        console.log('User photos response:', response);
        setUserUploadedPhotos(response.photos || []);
      } catch (error) {
        console.error('Error fetching user photos:', error);
        setUserUploadedPhotos([]);
      }
    }

    fetchUserPhotos();
  }, [plushId, authContext.userId, sendRequest]);

  useEffect(() => {
    async function fetchPlush() {
      try {
        console.log('Fetching plush with ID:', plushId);
        console.log('API endpoint:', `${ENDPOINTS.PLUSH}/${plushId}`);
        
        const data = await sendRequest(
          `${ENDPOINTS.PLUSH}/${plushId}`
        );
        
        console.log('Received plush data:', data);
        setPlush(data.plush);
        setDebugInfo(null);
      } catch (error) {
        console.error('Error fetching plush:', error);
        setDebugInfo({
          plushId,
          endpoint: `${ENDPOINTS.PLUSH}/${plushId}`,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    fetchPlush();
  }, [plushId, sendRequest]);

  // Check if current user has favorited this plush and get custom lists
  useEffect(() => {
    async function checkIfFavorited() {
      if (!authContext.isLoggedIn || !authContext.userId) {
        return;
      }
      
      try {
        const userData = await sendRequest(
          `${ENDPOINTS.USERS}/${authContext.userId}`,
          'GET',
          null,
          {
            Authorization: `Bearer ${authContext.token}`
          }
        );
        
        if (userData.user && userData.user.likes) {
          setIsFavorited(userData.user.likes.includes(plushId));
        }
        
        if (userData.user && userData.user.wishlist) {
          setIsWishlisted(userData.user.wishlist.includes(plushId));
        }

        // Set custom lists
        if (userData.user && userData.user.customLists) {
          setUserCustomLists(userData.user.customLists);
        }
      } catch (error) {
        console.log("Error checking favorite/wishlist status:", error);
      }
    }

    checkIfFavorited();
  }, [plushId, authContext.isLoggedIn, authContext.userId, sendRequest]);




  function handleAddToListClick() {
    setShowAddToListModal(true);
  }

  function closeAddToListModal() {
    setShowAddToListModal(false);
  }

  async function addToFavorites() {
    if (!authContext.isLoggedIn) {
      alert("Please log in to add items to favorites!");
      setShowAddToListModal(false);
      return;
    }
    
    if (isFavorited) {
      alert("This item is already in your favorites!");
      setShowAddToListModal(false);
      return;
    }
    
    setIsAddingToFavorites(true);
    
    try {
      await sendRequest(
        `${ENDPOINTS.PLUSH}/${plushId}/favorites`,
        "POST",
        null,
        {
          Authorization: `Bearer ${authContext.token}`,
        }
      );
      setIsFavorited(true);
      alert("Successfully added to favorites!");
    } catch (error) {
      console.log(error);
      if (error.message && error.message.includes("already in favorites")) {
        clearError(); // Clear the error from useHttp so ErrorModal doesn't show
        alert("This item is already in your favorites!");
        setIsFavorited(true);
      } else {
        alert("Failed to add to favorites. Please try again.");
      }
    } finally {
      setIsAddingToFavorites(false);
      setShowAddToListModal(false);
    }
  }

  async function addToWishlist() {
    if (!authContext.isLoggedIn) {
      alert("Please log in to add items to wishlist!");
      setShowAddToListModal(false);
      return;
    }
    
    if (isWishlisted) {
      alert("This item is already in your wishlist!");
      setShowAddToListModal(false);
      return;
    }
    
    setIsAddingToWishlist(true);
    
    try {
      await sendRequest(
        `${ENDPOINTS.PLUSH}/${plushId}/wishlist`,
        "POST",
        null,
        {
          Authorization: `Bearer ${authContext.token}`,
        }
      );
      setIsWishlisted(true);
      alert("Successfully added to wishlist!");
    } catch (error) {
      console.log(error);
      if (error.message && error.message.includes("already in wishlist")) {
        clearError(); // Clear the error from useHttp so ErrorModal doesn't show
        alert("This item is already in your wishlist!");
        setIsWishlisted(true);
      } else {
        alert("Failed to add to wishlist. Please try again.");
      }
    } finally {
      setIsAddingToWishlist(false);
      setShowAddToListModal(false);
    }
  }

  function handleCreateNewList() {
    setShowAddToListModal(false);
    setShowCreateListModal(true);
  }

  // Handle photo upload
  async function handlePhotoUpload(formData) {
    if (!authContext.isLoggedIn) {
      alert("Please log in first to upload photos!");
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const response = await sendRequest(
        `${ENDPOINTS.PLUSH_PHOTOS}/${plushId}`,
        "POST",
        formData,
        {
          Authorization: `Bearer ${authContext.token}`,
        }
      );

      // Refresh photo list
      const allPhotosResponse = await sendRequest(
        `${ENDPOINTS.PLUSH_PHOTOS}/${plushId}`
      );
      setAllUserPhotos(allPhotosResponse.photos || []);

      const userPhotosResponse = await sendRequest(
        `${ENDPOINTS.PLUSH_PHOTOS}/${plushId}/user/${authContext.userId}`
      );
      setUserUploadedPhotos(userPhotosResponse.photos || []);

      setShowPhotoUpload(false);
      alert("Photo uploaded successfully!");

    } catch (error) {
      console.error('Error uploading photo:', error);
      alert("Photo upload failed, please try again!");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function handleUploadClick() {
    setShowPhotoUpload(true);
  }

  function handleCancelUpload() {
    setShowPhotoUpload(false);
  }

  function closeCreateListModal() {
    setShowCreateListModal(false);
    setNewListName("");
  }

  async function createNewList() {
    if (!newListName.trim()) {
      alert("Please enter a list name!");
      setShowCreateListModal(false);
      return;
    }

    if (!authContext.isLoggedIn) {
      alert("Please log in to create lists!");
      setShowCreateListModal(false);
      return;
    }

    setIsCreatingList(true);

    try {
      const responseData = await sendRequest(
        `${ENDPOINTS.USERS}/${authContext.userId}/custom-lists`,
        "POST",
        JSON.stringify({ 
          name: newListName.trim(),
          plushId: plushId // Also add current plush to new list
        }),
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext.token}`,
        }
      );
      
      // Update local state with the new list
      setUserCustomLists(prev => [...prev, responseData.list]);
      
      alert(`Successfully created list "${newListName}" and added plush to it!`);
      setNewListName("");
    } catch (error) {
      console.error("Error creating new list:", error);
      alert("Failed to create list. Please try again.");
    } finally {
      setIsCreatingList(false);
      setShowCreateListModal(false);
      setShowAddToListModal(false);
    }
  }

  async function addToCustomList(listId) {
    if (!authContext.isLoggedIn) {
      alert("Please log in to add items to lists!");
      setShowAddToListModal(false);
      return;
    }

    try {
      await sendRequest(
        `${ENDPOINTS.USERS}/${authContext.userId}/custom-lists/${listId}/plush`,
        "POST",
        JSON.stringify({ plushId: plushId }),
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext.token}`,
        }
      );

      // Update local state to reflect the change
      setUserCustomLists(prev => 
        prev.map(list => 
          list._id === listId 
            ? { ...list, plushItems: [...list.plushItems, plushId] }
            : list
        )
      );

      alert("Successfully added to list!");
    } catch (error) {
      console.error("Error adding to custom list:", error);
      if (error.message && error.message.includes("already in this list")) {
        clearError(); // Clear the error from useHttp so ErrorModal doesn't show
        alert("This item is already in that list!");
      } else {
        alert("Failed to add to list. Please try again.");
      }
    } finally {
      setShowAddToListModal(false);
    }
  }

  // Check if plush is already in a specific custom list
  function isPlushInCustomList(listId) {
    const list = userCustomLists.find(list => list._id === listId);
    return list && list.plushItems && list.plushItems.includes(plushId);
  }


  function navigateToPhotosPage() {
    history.push(`/plush/${plushId}/photos`);
  }

  if (isLoading) {
    console.log('[PlushDetail] Rendering loading state');
    return (
      <div className={classes.loadingContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!plush) {
    console.log('[PlushDetail] Rendering error state - plush not found');
    console.log('[PlushDetail] Current plush state:', plush);
    console.log('[PlushDetail] Current error state:', error);
    console.log('[PlushDetail] Current loading state:', isLoading);
    return (
      <div className={classes.errorContainer}>
        <h2>Plush not found!</h2>
        {debugInfo && (
          <div style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            margin: '15px 0', 
            borderRadius: '5px', 
            border: '1px solid #dee2e6',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            <h4>Debug Information:</h4>
            <p><strong>Plush ID:</strong> {debugInfo?.plushId}</p>
            <p><strong>API Endpoint:</strong> {debugInfo?.endpoint}</p>
            <p><strong>Error:</strong> {debugInfo?.error}</p>
            <p><strong>Timestamp:</strong> {debugInfo?.timestamp}</p>
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>Frontend Port:</strong> {window.location.port || '80/443'}</p>
            <p><strong>Backend Expected:</strong> {API_BASE_URL}</p>
          </div>
        )}
        <Button onClick={() => history.push("/")}>Back to Plush List</Button>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />
      
      {/* Create New List Modal */}
      <Modal
        show={showCreateListModal}
        onCancel={closeCreateListModal}
        header="Create New List"
        className={classes.createListModal}
      >
        <div className={classes.createListContent}>
          <div className={classes.inputGroup}>
            <label htmlFor="listName" className={classes.inputLabel}>
              List Name
            </label>
            <input
              id="listName"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name..."
              className={classes.listNameInput}
              maxLength={50}
              autoFocus
            />
            <small className={classes.inputHint}>
              Choose a name that describes your collection (e.g., "Birthday Gifts", "Kawaii Collection")
            </small>
          </div>
        </div>
        
        <div className={classes.modalActions}>
          <Button onClick={closeCreateListModal} inverse>
            Cancel
          </Button>
          <Button 
            onClick={createNewList}
            disabled={isCreatingList || !newListName.trim()}
            style={{
              opacity: (isCreatingList || !newListName.trim()) ? 0.6 : 1
            }}
          >
            {isCreatingList ? 'Creating...' : 'Create List'}
          </Button>
        </div>
      </Modal>

      {/* Add to List Modal */}
      <Modal
        show={showAddToListModal}
        onCancel={closeAddToListModal}
        header="Save to list"
        className={classes.addToListModal}
      >
        <div className={classes.addToListContent}>
          {/* Create new list option */}
          <div className={classes.listOption} onClick={handleCreateNewList}>
            <div className={classes.listIcon}>
              <span className={classes.plusIcon}>+</span>
            </div>
            <div className={classes.listInfo}>
              <span className={classes.listName}>Create new list</span>
            </div>
          </div>
          
          {/* Owned option */}
          <div className={`${classes.listOption} ${isFavorited ? classes.alreadyAdded : ''}`}>
            
            <div className={classes.listInfo}>
              <span className={classes.listName}>Owned</span>
              <span className={classes.itemCount}>
                {isFavorited ? 'Already added' : 'Plushies you own'}
              </span>
            </div>
            <div className={classes.listActions}>
              {isFavorited ? (
                <div className={classes.checkIcon}>✓</div>
              ) : (
                <Button 
                  onClick={addToFavorites}
                  disabled={isAddingToFavorites}
                  inverse
                >
                  {isAddingToFavorites ? 'Adding...' : 'Add'}
                </Button>
              )}
            </div>
          </div>

          {/* Wishlist option */}
          <div className={`${classes.listOption} ${isWishlisted ? classes.alreadyAdded : ''}`}>
            
            <div className={classes.listInfo}>
              <span className={classes.listName}>Wishlist</span>
              <span className={classes.itemCount}>
                {isWishlisted ? 'Already added' : 'Things you want to buy'}
              </span>
            </div>
            <div className={classes.listActions}>
              {isWishlisted ? (
                <div className={classes.checkIcon}>✓</div>
              ) : (
                <Button 
                  onClick={addToWishlist}
                  disabled={isAddingToWishlist}
                  inverse
                >
                  {isAddingToWishlist ? 'Adding...' : 'Add'}
                </Button>
              )}
            </div>
          </div>

          {/* Custom Lists */}
          {userCustomLists.map((customList) => {
            const isInThisList = isPlushInCustomList(customList._id);
            return (
              <div key={customList._id} className={`${classes.listOption} ${isInThisList ? classes.alreadyAdded : ''}`}>
                <div className={classes.listIcon}>
                  <span className={classes.bookmarkIcon}>
                    {isInThisList ? '📋' : '📝'}
                  </span>
                </div>
                <div className={classes.listInfo}>
                  <span className={classes.listName}>{customList.name}</span>
                  <span className={classes.itemCount}>
                    {isInThisList 
                      ? 'Already added' 
                      : `${customList.plushItems ? customList.plushItems.length : 0} items`
                    }
                  </span>
                </div>
                <div className={classes.listActions}>
                  {isInThisList ? (
                    <div className={classes.checkIcon}>✓</div>
                  ) : (
                    <Button 
                      onClick={() => addToCustomList(customList._id)}
                      disabled={isLoadingLists}
                      inverse
                    >
                      Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className={classes.modalActions}>
          <Button onClick={closeAddToListModal} inverse>
            Done
          </Button>
        </div>
      </Modal>

      <div className={classes.plushDetail}>
        <div className={classes.backButton}>
          <Button onClick={() => history.goBack()} inverse>
            ← Back to Plush
          </Button>
        </div>

        {/* Photo Gallery Section - moved to top */}
        <div className={classes.photoGallery}>
          
          
          {/* Default display: 7:3 split layout */}
            <div className={classes.photoGalleryWrapper}>
              <div className={classes.photoDisplayContainer}>
                {/* Left side (70%) - Plush images display area */}
                <div className={classes.originalPhotosSection}>
                  <div className={classes.sectionHeader}>
                    <h3>Plush Images</h3>
                    <span className={classes.photoCount}>
                      {1 + allUserPhotos.length} Photos
                    </span>
                  </div>
                  <div className={classes.photoPreview}>
                    {/* First image: Always display plush's official image */}
                    <div className={classes.mainPhotoContainer}>
                      <img
                        src={plush?.image ? 
                          (plush.image.startsWith('http') ? 
                            plush.image : 
                            `${ASSET_BASE_URL}/${plush.image}`) : 
                          'https://via.placeholder.com/400x400?text=No+Image'}
                        alt={plush?.name || 'Plush'}
                        className={classes.mainPhoto}
                        onError={(e) => {
                          console.error('Official plush image load error:', e.target.src);
                          // 如果S3图片加载失败，使用占位符图片
                          e.target.src = `https://via.placeholder.com/400x400/FFB6C1/000000?text=${encodeURIComponent(plush?.name || 'Plush')}`;
                        }}
                      />
                      <div className={classes.photoInfo}>
                        <span>Official Image</span>
                      </div>
                    </div>
                    
                    {/* Other images: Show plush photos from the database */}
                    {allUserPhotos.length > 0 && (
                      <div className={classes.photoGridContainer}>
                        {allUserPhotos.slice(0, 4).map((photo, index) => (
                          <div key={photo.id || index} className={classes.gridPhotoContainer}>
                            <img
                              src={photo.imageUrl.startsWith('http') 
                                ? photo.imageUrl 
                                : `${ASSET_BASE_URL}/${photo.imageUrl.replace('uploads/images/', '')}`}
                              alt={`${plush.name} - Photo ${index + 1}`}
                              className={classes.gridPhoto}
                              onError={(e) => {
                                console.error('Grid image load error:', e.target.src);
                                e.target.src = `https://via.placeholder.com/200x200/FFB6C1/000000?text=Photo+${index + 1}`;
                              }}
                            />
                            {/* If it's the last one and there are more photos, show 'more' overlay */}
                            {index === 3 && allUserPhotos.length > 4 && (
                              <div 
                                className={classes.morePhotosOverlay}
                                onClick={navigateToPhotosPage}
                                style={{ cursor: 'pointer' }}
                              >
                                +{allUserPhotos.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side (30%) - My shares area */}
                <div className={classes.userPhotosSection}>
                  <div className={classes.userPhotosHeader}>
                    <h3>My Shares</h3>
                    {authContext.isLoggedIn && (
                      <Button onClick={handleUploadClick} inverse size="small">
                        Upload Photo
                      </Button>
                    )}
                  </div>
                  {authContext.isLoggedIn ? (
                    <div className={classes.userPhotosGrid}>
                      {/* Here we can get current user uploaded photos from API in the future */}
                      {userUploadedPhotos && userUploadedPhotos.length > 0 && (
                        <>
                          {userUploadedPhotos.slice(0, 4).map((photo, index) => (
                            <div key={photo.id || index} className={classes.userPhotoItem}>
                              <img 
                                src={photo.imageUrl.startsWith('http') 
                                  ? photo.imageUrl 
                                  : `${ASSET_BASE_URL}/${photo.imageUrl.replace('uploads/images/', '')}`}
                                alt={`My uploaded photo ${index + 1}`}
                                className={classes.userPhoto}
                                onError={(e) => {
                                  console.error('User photo load error:', e.target.src);
                                  e.target.src = `https://via.placeholder.com/150x150/FFB6C1/000000?text=My+Photo+${index + 1}`;
                                }}
                              />
                            </div>
                          ))}
                          {userUploadedPhotos.length > 4 && (
                            <div className={classes.morePhotosIndicator}>
                              <span>{userUploadedPhotos.length - 4} more photos...</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={classes.loginPromptSmall}>
                      <p>Login to upload and manage your photo shares</p>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>

          {/* Plush Information Section */}
            <div className={classes.plushContent}>
              <div className={classes.plushInfo}>
                <h1 className={classes.plushName}>{plush.name}</h1>

                <div className={classes.plushDescription}>
                  <p>{plush.description}</p>
                </div>

                <div className={classes.plushActions}>
                  <Button onClick={handleAddToListClick} inverse>
                    Add to List
                  </Button>
                </div>
              </div>
            </div>
        </div>

        {/* Photo upload component */}
        <PhotoUpload
          show={showPhotoUpload}
          onUpload={handlePhotoUpload}
          onCancel={handleCancelUpload}
          isLoading={isUploadingPhoto}
        />

        {/* Simple Auto-Dismissing Modal */}
        {showSimpleModal && (
          <div className={classes.simpleModalOverlay}>
            <div className={classes.simpleModal}>
              <div className={classes.simpleModalContent}>
                {simpleModalMessage}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default PlushDetail;
