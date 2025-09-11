import React, { useContext } from "react";
import { useHistory } from "react-router-dom";

import Input from "../../shared/components/FormElements/Input/Input";
import Button from "../../shared/components/FormElements/Button/Button";
import ErrorModal from "../../shared/components/UI/ErrorModal/ErrorModal";
import LoadingSpinner from "../../shared/components/UI/LoadingSpinner/LoadingSpinner";
import ImageUpload from "../../shared/components/FormElements/ImageUpload/ImageUpload";
import useForm from "../../shared/hooks/form-hook";
import useHttp from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/contexts/auth-context";
import {
  VALIDATOR_MINLENGTH,
  VALIDATOR_REQUIRE
} from "../../shared/util/validators";
import { API_BASE_URL } from "../../config";

import classes from "./PlaceForm.module.css";

function NewPlush() {
  const history = useHistory();
  const authContext = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttp();
  const [formState, inputHandler] = useForm(
    {
      name: {
        value: "",
        isValid: false
      },
      brand: {
        value: "",
        isValid: false
      },
      category: {
        value: "Hello Kitty",
        isValid: true
      },
      description: {
        value: "",
        isValid: false
      },
      price: {
        value: "",
        isValid: false
      },
      image: {
        value: null,
        isValid: false
      }
    },
    false
  );

  async function plushSubmitHandler(event) {
    event.preventDefault();

    try {
      const formData = new FormData();

      formData.append("name", formState.inputs.name.value);
      formData.append("brand", formState.inputs.brand.value);
      formData.append("category", formState.inputs.category.value);
      formData.append("description", formState.inputs.description.value);
      formData.append("price", formState.inputs.price.value);
      formData.append("image", formState.inputs.image.value);

      await sendRequest(
        `${API_BASE_URL}/plush`,
        "POST",
        formData,
        {
          Authorization: `Bearer ${authContext.token}`
        }
      );

      history.push("/");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />
      <form className={classes["plush-form"]} onSubmit={plushSubmitHandler}>
        {isLoading && <LoadingSpinner asOverlay />}
        <Input
          id="name"
          element="input"
          type="text"
          label="Plush Name"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter a valid name!"
          onInput={inputHandler}
        />
        <Input
          id="brand"
          element="input"
          type="text"
          label="Brand"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter a valid brand!"
          onInput={inputHandler}
        />
        <div className={classes["form-control"]}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={formState.inputs.category.value}
            onChange={(e) => inputHandler("category", e.target.value, true)}
          >
            <option value="Hello Kitty">Hello Kitty</option>
            <option value="Sanrio">Sanrio</option>
            <option value="Disney">Disney</option>
            <option value="Pokemon">Pokemon</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <Input
          id="description"
          label="Description"
          validators={[VALIDATOR_MINLENGTH(5)]}
          errorText="At least five characters!"
          onInput={inputHandler}
        />
        <Input
          id="price"
          element="input"
          type="number"
          step="0.01"
          min="0"
          label="Price ($)"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter a valid price!"
          onInput={inputHandler}
        />
        <ImageUpload
          id="image"
          onInput={inputHandler}
          errorText="Please provide an image!"
        />
        <Button type="submit" disabled={!formState.isValid}>
          Add Plush
        </Button>
      </form>
    </>
  );
}

export default NewPlush;
