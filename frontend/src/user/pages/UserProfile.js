import React, { useState, useEffect, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";

import ErrorModal from "../../shared/components/UI/ErrorModal/ErrorModal";
import LoadingSpinner from "../../shared/components/UI/LoadingSpinner/LoadingSpinner";
import useHttp from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/contexts/auth-context";
import { ENDPOINTS, ASSET_BASE_URL } from "../../config";
import PlushList from "../../places/components/PlaceList/PlaceList";
import Card from "../../shared/components/UI/Card/Card";
import ImageGrid from "../../shared/components/UI/ImageGrid/ImageGrid";

import classes from "./UserProfile.module.css";

function UserProfile() {
  const { userId } = useParams();
  const history = useHistory();
  const authContext = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttp();
  const [userProfile, setUserProfile] = useState();
  const [activeTab, setActiveTab] = useState("owned");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [customLists, setCustomLists] = useState([]);
  const [selectedCustomList, setSelectedCustomList] = useState(null);
  const [isViewingListDetail, setIsViewingListDetail] = useState(false);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [userNotFound, setUserNotFound] = useState(false);

  const isOwnProfile = authContext.userId === userId;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const responseData = await sendRequest(
          `${ENDPOINTS.USERS}/${userId}`,
          "GET",
          null,
          {
            Authorization: "Bearer " + authContext.token,
          }
        );
        
        setUserProfile(responseData.user);
        
        // Set custom lists from user data
        if (responseData.user.customLists) {
          setCustomLists(responseData.user.customLists);
        }
        
        setHasLoaded(true);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        if (err.message.includes("404") || err.message.includes("not found")) {
          setUserNotFound(true);
        }
      }
    };

    if (userId && authContext.token) {
      fetchUser();
    }
  }, [userId, authContext.token, sendRequest]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset custom list detail view when switching tabs
    if (tab !== "custom-lists") {
      setIsViewingListDetail(false);
      setSelectedCustomList(null);
    }
  };

  const handleViewCustomList = (list) => {
    setSelectedCustomList(list);
    setIsViewingListDetail(true);
  };

  const handleBackToCustomLists = () => {
    setIsViewingListDetail(false);
    setSelectedCustomList(null);
  };

  const handleEditProfile = () => {
    // TODO: Implement edit profile functionality
    console.log("Edit profile clicked");
  };

  const handleSendMessage = () => {
    // TODO: Implement message functionality
    console.log("Send message clicked");
    setShowMessageModal(false);
  };



  const handleRemoveFromWishlist = async (plushId) => {
    try {
      await sendRequest(
        `${ENDPOINTS.USERS}/${userId}/wishlist/${plushId}`,
        "DELETE",
        null,
        {
          Authorization: "Bearer " + authContext.token,
        }
      );
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        wishlist: prev.wishlist.filter(plush => plush.id !== plushId)
      }));
    } catch (err) {
      console.error("Error removing plush from wishlist:", err);
    }
  };


  const handleRemoveFromCollection = async (plushId) => {
    try {
      await sendRequest(
        `${ENDPOINTS.USERS}/${userId}/plush-collection/${plushId}`,
        "DELETE",
        null,
        {
          Authorization: "Bearer " + authContext.token,
        }
      );
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        plushCollection: prev.plushCollection.filter(plush => plush.id !== plushId)
      }));
    } catch (err) {
      console.error("Error removing plush from collection:", err);
    }
  };


  const handleRemoveFromCustomList = async (listId, plushId) => {
    try {
      await sendRequest(
        `${ENDPOINTS.USERS}/${userId}/custom-lists/${listId}/plush/${plushId}`,
        "DELETE",
        null,
        {
          Authorization: "Bearer " + authContext.token,
        }
      );
      
      // Update local state
      setCustomLists(prev => 
        prev.map(list => 
          list.id === listId 
            ? { ...list, plushItems: list.plushItems.filter(plush => plush.id !== plushId) }
            : list
        )
      );
    } catch (err) {
      console.error("Error removing plush from custom list:", err);
    }
  };

  if (userNotFound) {
    return (
      <div className="center">
        <Card>
          <h2>User not found</h2>
          <p>The user you're looking for doesn't exist.</p>
          <button onClick={() => history.push("/")}>Go Home</button>
        </Card>
      </div>
    );
  }

  if (!hasLoaded || isLoading) {
    return (
      <div className="center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="center">
        <Card>
          <h2>Could not load user profile</h2>
        </Card>
      </div>
    );
  }

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      
      {/* Message Modal */}
      {showMessageModal && (
        <div className={classes.modalOverlay}>
          <div className={classes.modalContent}>
            <h3>Send Message to {userProfile.name}</h3>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..."
              className={classes.messageTextarea}
            />
            <div className={classes.modalActions}>
              <button 
                onClick={() => setShowMessageModal(false)}
                className={classes.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendMessage}
                className={classes.sendButton}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className={classes.profileLayout}>
        {/* Left Sidebar - User Profile and Navigation */}
        <div className={classes.leftSidebar}>
          {/* User Name Header */}
          <div className={classes.userNameHeader}>
            <h1>{userProfile.name}</h1>
          </div>

          {/* Profile Card */}
          <div className={classes.profileCard}>
            <div className={classes.profileImageContainer}>
              <img 
                src={userProfile.image ? `${ASSET_BASE_URL}/${userProfile.image}` : "https://via.placeholder.com/120x120?text=Profile"} 
                alt={userProfile.name}
                className={classes.profileImage}
              />
              {isOwnProfile && (
                <button className={classes.editProfileIcon} onClick={handleEditProfile}>
                  ✏️
                </button>
              )}
            </div>
            
            <div className={classes.profileInfo}>
              <h2 className={classes.profileName}>{userProfile.name}</h2>
              <p className={classes.profileLocation}>📍 Seattle, Washington</p>
              <p className={classes.profileMemberSince}>
                Member since {new Date(userProfile.createdAt || Date.now()).getFullYear()}
              </p>

              {/* Profile Stats */}
              <div className={classes.profileStats}>
                <div className={classes.statItem}>
                  <span className={classes.statValue}>0</span>
                  <span className={classes.statLabel}>Following</span>
                </div>
                <div className={classes.statItem}>
                  <span className={classes.statValue}>0</span>
                  <span className={classes.statLabel}>Followers</span>
                </div>
              </div>

              {/* Profile Actions */}
              {!isOwnProfile && (
                <div className={classes.profileActions}>
                  <button className={classes.followButton}>
                    Follow
                  </button>
                  <button 
                    className={classes.messageButton}
                    onClick={() => setShowMessageModal(true)}
                  >
                    Message
                  </button>
                </div>
              )}
            </div>
          </div>


          {/* Sidebar Footer */}
          <div className={classes.sidebarFooter}>
            <p className={classes.copyright}>
              © 2024 Character Collectibles. All rights reserved.
            </p>
            <div className={classes.footerLinks}>
              <a href="#" className={classes.footerLink}>Privacy Policy</a>
              <a href="#" className={classes.footerLink}>Terms of Service</a>
              <a href="#" className={classes.footerLink}>Contact Support</a>
            </div>
            <div className={classes.languageSelector}>
              <select className={classes.languageSelect}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className={classes.rightContent}>
          {/* Content Tabs */}
          <div className={classes.contentTabs}>
            <button 
              className={`${classes.tab} ${activeTab === "owned" ? classes.active : ""}`}
              onClick={() => handleTabChange("owned")}
            >
              Owned Plush
            </button>
            <button 
              className={`${classes.tab} ${activeTab === "wishlist" ? classes.active : ""}`}
              onClick={() => handleTabChange("wishlist")}
            >
              Wishlist
            </button>
            <button 
              className={`${classes.tab} ${activeTab === "custom-lists" ? classes.active : ""}`}
              onClick={() => handleTabChange("custom-lists")}
            >
              Custom Lists
            </button>
          </div>

          {/* Content Area */}
          <div className={classes.contentArea}>
            {activeTab === "owned" && (
              <div className={classes.tabContent}>
                <PlushList 
                  items={userProfile.plushCollection || []} 
                  hideAddButton={true} 
                  showFilters={false}
                  profileView={true}
                  onRemoveFromList={handleRemoveFromCollection}
                />
              </div>
            )}
            {activeTab === "wishlist" && (
              <div className={classes.tabContent}>
                <PlushList 
                  items={userProfile.wishlist || []} 
                  hideAddButton={true} 
                  showFilters={false}
                  profileView={true}
                  onRemoveFromList={handleRemoveFromWishlist}
                />
              </div>
            )}
            {activeTab === "custom-lists" && (
              <div className={classes.tabContent}>
                {!isViewingListDetail ? (
                  <>
                    <div className={classes.customListsHeader}>
                      <h3>Custom Lists</h3>
                    </div>
                
                {customLists.length === 0 ? (
                  <div className={classes.emptyState}>
                    <div className={classes.emptyIcon}>📋</div>
                    <h4>No custom lists yet</h4>
                    
                  </div>
                ) : (
                  <div className={classes.customListsGrid}>
                    {customLists.map(list => (
                      <div key={list.id} className={classes.customListCard}>
                        <div className={classes.listHeader}>
                          <h4 className={classes.listTitle}>{list.name}</h4>
                          <span className={classes.listCount}>
                            {list.plushItems?.length || 0} items
                          </span>
                        </div>
                        <div className={classes.listPreview}>
                          {list.plushItems?.slice(0, 3).map(plush => (
                            <img 
                              key={plush.id}
                              src={plush.image ? `${ASSET_BASE_URL}/${plush.image}` : "https://via.placeholder.com/60x60?text=Plush"}
                              alt={plush.title}
                              className={classes.previewImage}
                            />
                          ))}
                          {(list.plushItems?.length || 0) === 0 && (
                            <div className={classes.emptyListPreview}>
                              <span>Empty list</span>
                            </div>
                          )}
                        </div>
                        <div className={classes.listActions}>
                          <button 
                            className={classes.viewListButton}
                            onClick={() => handleViewCustomList(list)}
                          >
                            View List
                          </button>
                          {isOwnProfile && (
                            <button 
                              className={classes.deleteListButton}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${list.name}"?`)) {
                                  // TODO: Implement list deletion
                                  console.log("Delete list:", list.name);
                                }
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  </>
                ) : (
                  // Custom List Detail View
                  <div className={classes.listDetailView}>
                    <div className={classes.listDetailHeader}>
                      <button 
                        className={classes.backButton}
                        onClick={handleBackToCustomLists}
                      >
                        ← Back to Lists
                      </button>
                      <h3>{selectedCustomList?.name}</h3>
                      <span className={classes.listItemCount}>
                        {selectedCustomList?.plushItems?.length || 0} items
                      </span>
                    </div>
                    
                    {selectedCustomList?.plushItems?.length === 0 ? (
                      <div className={classes.emptyListDetail}>
                        <div className={classes.emptyIcon}>📋</div>
                        <h4>This list is empty</h4>
                        <p>No plush items have been added to this list yet.</p>
                      </div>
                    ) : (
                      <PlushList 
                        items={selectedCustomList?.plushItems || []} 
                        hideAddButton={true} 
                        showFilters={false}
                        profileView={true}
                        onRemoveFromList={isOwnProfile ? handleRemoveFromCustomList : null}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default UserProfile;

