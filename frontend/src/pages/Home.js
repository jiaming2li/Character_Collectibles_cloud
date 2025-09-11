import React, { useState, useEffect } from "react";

import PlushList from "../places/components/PlaceList/PlaceList";
import SimpleImageGrid from "../shared/components/UI/SimpleImageGrid/SimpleImageGrid";
import ErrorModal from "../shared/components/UI/ErrorModal/ErrorModal";
import LoadingSpinner from "../shared/components/UI/LoadingSpinner/LoadingSpinner";
import useHttp from "../shared/hooks/http-hook";
import { ENDPOINTS } from "../config";

import classes from "./Home.module.css";

function Home() {
  const { isLoading, error, sendRequest, clearError } = useHttp();
  const [plush, setPlush] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    async function fetchPlush() {
      try {
        const data = await sendRequest(
          `${ENDPOINTS.PLUSH}?limit=50`
        );

        setPlush(data.plush);
      } catch (error) {
        console.log(error);
      }
    }

    fetchPlush();
  }, [sendRequest]);

  function deletePlushHandler(plushId) {
    setPlush((prevPlush) =>
      prevPlush.filter((item) => item.id !== plushId)
    );
  }

  function likePlushHandler(plushId, isLiked) {
    setPlush((prevPlush) =>
      prevPlush.map((item) => {
        if (item.id === plushId) {
          const newLikes = isLiked 
            ? [...(item.likes || []), "current-user-id"]
            : (item.likes || []).filter(id => id !== "current-user-id");
          return { ...item, likes: newLikes };
        }
        return item;
      })
    );
  }

  function wishlistAddHandler(plushId) {
    setPlush((prevPlush) =>
      prevPlush.map((item) => {
        if (item.id === plushId) {
          return { ...item, inWishlist: true };
        }
        return item;
      })
    );
  }

  function reviewAddedHandler() {
    async function refreshPlush() {
      try {
        const data = await sendRequest(
          `${ENDPOINTS.PLUSH}?limit=50`
        );
        setPlush(data.plush);
      } catch (error) {
        console.log(error);
      }
    }
    refreshPlush();
  }


  const filteredPlush = plush ? plush.filter(item => {
    const matchesSearch = !searchTerm || 
                         item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />
      
      {/* Hero Section */}
      <div className={classes.hero}>
        <div className={classes.heroContent}>
          <div className={classes.heroText}>
            <h1 className={classes.heroTitle}>Find your perfect plush and Figurine</h1>
            <p className={classes.heroSubtitle}>
              Discover amazing Hello Kitty, Sanrio, Disney, Pokemon, and other IP plush from collectors worldwide
            </p>
            
            <div className={classes.searchContainer}>
              <input
                type="text"
                placeholder="Search character by name, brand, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={classes.searchInput}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // Search is automatically triggered by state change
                  }
                }}
              />
              <button 
                className={classes.searchButton}
                onClick={() => {
                  // Search is automatically triggered by state change
                  if (searchTerm.trim()) {
                    document.querySelector('#search-results').scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }
                }}
              >
                <span role="img" aria-label="search">🔍</span> Search
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Search Results Section */}
      <div id="search-results" className={classes.resultsSection}>
        {(searchTerm || selectedCategory) && (
          <div className={classes.resultsHeader}>
            <h2 className={classes.sectionTitle}>
              {searchTerm ? `Search Results for "${searchTerm}"` : `Category: ${selectedCategory}`}
            </h2>
            <p className={classes.resultsCount}>
              {filteredPlush.length} {filteredPlush.length === 1 ? 'item' : 'items'} found
            </p>
            {(searchTerm || selectedCategory) && (
              <button 
                className={classes.clearButton}
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
        
        {isLoading && (
          <div className={classes.loadingContainer}>
            <LoadingSpinner />
          </div>
        )}
        
        {!isLoading && (searchTerm || selectedCategory) && (
          <>
            {filteredPlush.length > 0 ? (
              <PlushList 
                items={filteredPlush}
                onDelete={deletePlushHandler}
                onLike={likePlushHandler}
                onWishlistAdd={wishlistAddHandler}
                onReviewAdded={reviewAddedHandler}
                showFilters={false}
                hideAddButton={true}
              />
            ) : (
              <div className={classes.noResults}>
                <div className={classes.noResultsIcon}>
                  <span role="img" aria-label="search">🔍</span>
                </div>
                <h3>No plush found</h3>
                <p>Try adjusting your search terms or browse by category</p>
              </div>
            )}
          </>
        )}
        
        {!isLoading && !searchTerm && !selectedCategory && (
          <div className={classes.featuredSection}>
            <h2 className={classes.featuredTitle}>Trending Characters</h2>
            <SimpleImageGrid 
              items={plush || []}
              maxItems={20}
            />
          </div>
        )}
      </div>

      {/* Bottom Hero Image Section */}
      <div className={classes.heroImageSection}>
        <div className={classes.heroImageContent}>
          <div className={classes.heroImageOverlay}>
            {/* You can add content here if needed */}
          </div>
        </div>
      </div>

    </>
  );
}

export default Home;
