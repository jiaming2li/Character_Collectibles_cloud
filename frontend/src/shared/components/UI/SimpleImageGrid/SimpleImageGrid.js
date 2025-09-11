import React from "react";
import { Link } from "react-router-dom";
import { ASSET_BASE_URL } from "../../../../config";

import classes from "./SimpleImageGrid.module.css";

function SimpleImageGrid({ items, maxItems = 10 }) {
  if (!items || items.length === 0) {
    return (
      <div className={classes.emptyState}>
        <p>No plush toys available at the moment. Check back later for new adorable plush toys!</p>
      </div>
    );
  }

  // Limit the number of items to display
  const displayItems = items.slice(0, maxItems);

  return (
    <div className={classes.grid}>
      {displayItems.map((item) => (
        <Link 
          key={item.id} 
          to={`/plush/${item.id}/detail`} 
          className={classes.gridItem}
        >
          <div className={classes.imageContainer}>
            <img
              src={item.image ? `${ASSET_BASE_URL}/${item.image}` : "https://via.placeholder.com/200x200?text=Plush"}
              alt={item.name}
              className={classes.image}
            />
          </div>
          <div className={classes.nameContainer}>
            <span className={classes.itemName}>{item.name}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default SimpleImageGrid;
