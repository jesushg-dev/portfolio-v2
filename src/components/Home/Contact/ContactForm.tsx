"use client";

import React, { useRef, useTransition } from "react";
import type { FC } from "react";
import { useTranslations } from "next-intl";

import Input from "../../custom-ui/Input";
import type { IInputRef } from "../../../hooks/use-ref-input";
import TextArea from "../../custom-ui/TextArea";

const ContactForm: FC = () => {
  const t = useTranslations("main.contact");

  const nameRef = useRef<IInputRef>(null);
  const emailRef = useRef<IInputRef>(null);
  const messageRef = useRef<IInputRef>(null);
  const [pending, startTransition] = useTransition();

  const validateContactForm = (
    name: string,
    email: string,
    message: string,
  ) => {
    if (!name) {
      nameRef.current?.setErrorMessage(t("form.name.errors.required"));
      nameRef.current?.focus();
      return false;
    }
    nameRef.current?.setSuccessMessage(t("form.name.success"));

    if (!email) {
      emailRef.current?.setErrorMessage(t("form.email.errors.required"));
      emailRef.current?.focus();
      return false;
    }

    if (
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        email,
      )
    ) {
      emailRef.current?.setErrorMessage(t("form.email.errors.pattern"));
      emailRef.current?.focus();
      return false;
    }
    emailRef.current?.setSuccessMessage(t("form.email.success"));

    if (!message) {
      messageRef.current?.setErrorMessage(t("form.message.errors.required"));
      messageRef.current?.focus();
      return false;
    }
    messageRef.current?.setSuccessMessage(t("form.message.success"));

    return true;
  };

  const sendEmail = (name: string, email: string, message: string) => {
    startTransition(async () => {
      const body = new FormData();
      body.append("name", name);
      body.append("email", email);
      body.append("message", message);

      const res = await fetch("https://formspree.io/f/xnqwqkrl", {
        method: "POST",
        body,
        headers: {
          Accept: "application/json",
        },
      });

      if (res.ok) {
        nameRef.current?.clear();
        emailRef.current?.clear();
        messageRef.current?.clear();
        alert(t("form.success.description"));
      } else {
        alert(t("form.errors.description"));
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const name = (nameRef.current?.value() ?? "").trim();
      const email = (emailRef.current?.value() ?? "").trim();
      const message = (messageRef.current?.value() ?? "").trim();
      const isValid = validateContactForm(name, email, message);

      if (isValid) {
        sendEmail(name, email, message);
      }
    } catch {
      alert(t("form.errors.description"));
    }
  };

  return (
    <form
      id="contact-form"
      className="w-full space-y-2 px-10 py-8"
      onSubmit={handleSubmit}
    >
      <p className="text-primaryText-900 text-center text-lg font-bold lg:text-start">
        {t("title2")}
      </p>

      <Input
        ref={nameRef}
        inputProps={{
          id: "name",
          name: "name",
          type: "text",
          required: true,
          placeholder: t("form.name.placeholder"),
        }}
        label={t("form.name.label")}
      />

      <Input
        ref={emailRef}
        inputProps={{
          id: "email",
          name: "email",
          type: "email",
          required: true,
          placeholder: t("form.email.placeholder"),
        }}
        label={t("form.email.label")}
      />

      <TextArea
        ref={messageRef}
        textareaProps={{
          id: "message",
          name: "message",
          required: true,
          placeholder: t("form.message.placeholder"),
          rows: 3,
        }}
        label={t("form.message.label")}
      />

      <button
        onClick={handleSubmit}
        type="button"
        className="pressable bg-primary-700 text-secondaryText-50 hover:bg-primary-900 mt-6 w-full rounded-sm py-3 font-medium tracking-widest uppercase shadow-lg hover:shadow-none focus:outline-none"
      >
        {pending ? (
          <svg
            className="text-secondaryText-50 mr-2 h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" className="opacity-25" />
            <path
              d="M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0"
              className="opacity-75"
            />
          </svg>
        ) : null}
        {t("form.submit")}
      </button>
    </form>
  );
};

export default ContactForm;
