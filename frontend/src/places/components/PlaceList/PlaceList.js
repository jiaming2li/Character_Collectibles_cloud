import React, { useState } from "react";

import Card from "../../../shared/components/UI/Card/Card";
import Button from "../../../shared/components/FormElements/Button/Button";
import PlaceItem from "../PlaceItem/PlaceItem";

import classes from "./PlaceList.module.css";

function PlushList(props) {
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const categories = ['Hello Kitty', 'Sanrio', 'Disney', 'Pokemon', 'Other'];
  const brands = [...new Set(props.items.map(item => item.brand))];

  const filteredAndSortedItems = props.items
    .filter(item => {
      if (filterCategory && item.category !== filterCategory) return false;
      if (filterBrand && item.brand !== filterBrand) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'price') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (props.items.length === 0) {
    return (
      <Card className={`${classes["plush-list"]} center`}>
        <h2>No plush found in your collection.</h2>
        {!props.hideAddButton && (
          <Button to="/plush/new">Add Plush</Button>
        )}
      </Card>
    );
  }

  const showFilters = props.showFilters !== false;

  

  return (
    <div className={classes["plush-container"]}>
      {showFilters && (
      <div className={classes["filters-section"]}>
        <div className={classes["filter-group"]}>
          <label>Category:</label>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        

        <div className={classes["filter-group"]}>
          <label>Brand:</label>
          <select 
            value={filterBrand} 
            onChange={(e) => setFilterBrand(e.target.value)}
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        <div className={classes["filter-group"]}>
          <label>Sort By:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Date Added</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        <div className={classes["filter-group"]}>
          <label>Order:</label>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
      )}

      {filteredAndSortedItems.length === 0 ? (
        <Card className={`${classes["plush-list"]} center`}>
          <h2>No plush match your filters.</h2>
          <Button onClick={() => {
            setFilterCategory("");
            setFilterBrand("");
          }}>Clear Filters</Button>
        </Card>
      ) : (
        <ul className={classes["plush-list"]}>
          {filteredAndSortedItems.map((plush) => (
            <PlaceItem
              key={plush.id}
              id={plush.id}
              image={plush.image}
              name={plush.name}
              brand={plush.brand}
              category={plush.category}
              description={plush.description}
              price={plush.price}
              rating={plush.rating}
              likes={plush.likes}
              reviews={plush.reviews}
              creatorId={plush.creator}
              profileView={props.profileView}
              onDelete={props.onDelete}
              onLike={props.onLike}
              onWishlistAdd={props.onWishlistAdd}
              onReviewAdded={props.onReviewAdded}
              onRemoveFromList={props.onRemoveFromList}
            />
          ))}
        </ul>
      )}
    </div>
  );
  
}

export default PlushList;
