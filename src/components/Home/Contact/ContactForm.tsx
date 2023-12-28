import React, { FC, useRef } from 'react';

import Input from '../../UI/Input';
import TextArea from '../../UI/TextArea';

import { useTranslations } from 'next-intl';
import type { IInputRef } from '../../../hooks/useRefInput';

interface IContactFormProps {}

const ContactForm: FC<IContactFormProps> = ({}) => {
  const t = useTranslations('main.contact');

  const nameRef = useRef<IInputRef>(null);
  const emailRef = useRef<IInputRef>(null);
  const messageRef = useRef<IInputRef>(null);

  const validateContactForm = (name: string, email: string, message: string) => {
    if (!name) {
      nameRef.current?.setErrorMessage(t('form.name.errors.required'));
      nameRef.current?.focus();
      return false;
    }
    nameRef.current?.setSuccessMessage(t('form.name.success'));

    if (!email) {
      emailRef.current?.setErrorMessage(t('form.email.errors.required'));
      emailRef.current?.focus();
      return false;
    }

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {
      emailRef.current?.setErrorMessage(t('form.email.errors.pattern'));
      emailRef.current?.focus();
      return false;
    }
    emailRef.current?.setSuccessMessage(t('form.email.success'));

    if (!message) {
      messageRef.current?.setErrorMessage(t('form.message.errors.required'));
      messageRef.current?.focus();
      return false;
    }
    messageRef.current?.setSuccessMessage(t('form.message.success'));

    return true;
  };

  const sendEmail = async (name: string, email: string, message: string) => {
    const body = new FormData();
    body.append('name', name);
    body.append('email', email);
    body.append('message', message);

    const res = await fetch('https://formspree.io/f/xnqwqkrl', {
      method: 'POST',
      body,
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      nameRef.current?.clear();
      emailRef.current?.clear();
      messageRef.current?.clear();
      alert(t('form.success.description'));
    } else {
      alert(t('form.errors.description'));
    }
  };

  const handleSubmit = async () => {
    try {
      const name = (nameRef.current?.value() || '').trim();
      const email = (emailRef.current?.value() || '').trim();
      const message = (messageRef.current?.value() || '').trim();
      const isValid = validateContactForm(name, email, message);

      if (isValid) {
        sendEmail(name, email, message);
      }
    } catch (error) {
      alert(t('form.errors.description'));
    }
  };

  return (
    <form id="contact-form" className="w-full space-y-2 px-10 py-8" onSubmit={handleSubmit}>
      <p className="text-center text-lg font-bold text-primaryText-900 lg:text-start">{t('title2')}</p>

      <Input
        ref={nameRef}
        inputProps={{
          id: 'name',
          name: 'name',
          type: 'text',
          required: true,
          placeholder: t('form.name.placeholder'),
        }}
        label={t('form.name.label')}
      />

      <Input
        ref={emailRef}
        inputProps={{
          id: 'email',
          name: 'email',
          type: 'email',
          required: true,
          placeholder: t('form.email.placeholder'),
        }}
        label={t('form.email.label')}
      />

      <TextArea
        ref={messageRef}
        textareaProps={{
          id: 'message',
          name: 'message',
          required: true,
          placeholder: t('form.message.placeholder'),
          rows: 3,
        }}
        label={t('form.message.label')}
      />

      <button
        onClick={handleSubmit}
        type="button"
        className="pressable mt-6 w-full rounded bg-primary-700 py-3 font-medium uppercase tracking-widest text-secondaryText-50 shadow-lg hover:bg-primary-900 hover:shadow-none focus:outline-none">
        {t('form.submit')}
      </button>
    </form>
  );
};

export default ContactForm;
