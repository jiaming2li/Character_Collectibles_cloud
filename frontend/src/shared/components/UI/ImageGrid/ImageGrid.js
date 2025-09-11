import React from "react";
import { Link } from "react-router-dom";
import { ASSET_BASE_URL } from "../../../../config";

import classes from "./ImageGrid.module.css";

function ImageGrid({ items, title, onRemoveItem, showRemoveButton = false }) {
  if (!items || items.length === 0) {
    return (
      <div className={classes.emptyState}>
        <h3>{title}</h3>
        <p>No items in this collection yet.</p>
      </div>
    );
  }

  const handleRemoveClick = (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };

  return (
    <div className={classes.container}>
      <h3 className={classes.title}>{title}</h3>
      <div className={classes.grid}>
        {items.map((item) => (
          <div key={item.id} className={classes.itemContainer}>
            <Link to={`/plush/${item.id}/detail`} className={classes.imageItem}>
              <img
                src={`${ASSET_BASE_URL}/${item.image}`}
                alt={item.name}
                className={classes.image}
              />
              <div className={classes.overlay}>
                <span className={classes.itemName}>{item.name}</span>
              </div>
            </Link>
            <div className={classes.itemInfo}>
              <h4 className={classes.itemTitle}>{item.name}</h4>
              {showRemoveButton && (
                <button 
                  className={classes.removeButton}
                  onClick={(e) => handleRemoveClick(e, item.id)}
                  title="Remove from collection"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageGrid;
