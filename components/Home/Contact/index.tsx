import React, { FC, useRef } from 'react';

import Image from 'next/image';
import type { ImageLoaderProps } from 'next/dist/client/image';

import ContactItem from '../ContactItem';
import TextArea from '../../UI/TextArea';
import Input, { IInputRef } from '../../UI/Input';

import { FaLinkedin, FaGithub, FaWhatsapp, FaRegEnvelope, FaPhoneAlt } from 'react-icons/fa';

import { useTranslations } from 'next-intl';

interface IContactProps {}

const cloudinaryLoader = ({ src, width, quality }: ImageLoaderProps) => {
  const qualityString = quality ? ',q_' + quality : '';
  return `https://res.cloudinary.com/js-media/image/upload/w_${width}${qualityString},c_limit/v1670990294/portfolio/hero/${src}`;
};

const Contact: FC<IContactProps> = ({}) => {
  const t = useTranslations('contact');
  const nameRef = useRef<IInputRef>(null);
  const emailRef = useRef<IInputRef>(null);
  const messageRef = useRef<IInputRef>(null);

  const validateForm = () => {
    if (!nameRef.current?.value) {
      nameRef.current?.setErrorMessage('Name is required');
      nameRef.current?.focus();
      return false;
    }

    if (!emailRef.current?.value) {
      emailRef.current?.setErrorMessage('Email is required');
      emailRef.current?.focus();
      return false;
    }

    //validate email format
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailRef.current?.value)) {
      emailRef.current?.setErrorMessage('Invalid email address');
      emailRef.current?.focus();
      return false;
    }

    if (!messageRef.current?.value) {
      messageRef.current?.setErrorMessage('Message is required');
      messageRef.current?.focus();
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (validateForm()) {
        const nameValue = nameRef.current?.value || '';
        const messageValue = messageRef.current?.value || '';

        const body = new FormData();
        body.append('name', nameValue);
        body.append('message', messageValue);
        body.append('email', '123@gmail.com');

        const res = await fetch('https://formspree.io/f/xnqwqkrl', {
          method: 'POST',
          body,
          headers: {
            Accept: 'application/json',
          },
        });
        console.log(res);
      }
    } catch (error) {
      console.log('🚀 ~ file: index.tsx:27 ~ handleSubmit ~ error', error);
    }
  };

  return (
    <section className="hero w-full bg-black before:bg-hero-contact before:lg:bg-local">
      <div className="mx-auto flex items-center p-4 lg:container lg:p-20">
        <div className="z-20 flex w-full flex-col rounded bg-white lg:flex-row lg:items-center">
          <aside className="flex w-full flex-col justify-between  py-8 px-10">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold lg:text-4xl">{t('title')}</h1>
              <p className="flex items-center text-justify">{t('subtitle')}</p>
              <div className="-ml-3 flex flex-wrap justify-center gap-2">
                <ContactItem label="linkedin" href="https://linkedin.com/in/jesus-hernandez23" icon={FaLinkedin} />
                <ContactItem label="github" href="https://github.com/jess232017" icon={FaGithub} />
                <ContactItem label="whatsapp" href="https://wa.me/+50586793204" icon={FaWhatsapp} />
                <ContactItem label="phone" href="tel:86793204" icon={FaPhoneAlt} />
                <ContactItem label="email" href="mailto:jess232016@gmail.com" icon={FaRegEnvelope} />
              </div>
            </div>
            <Image
              width={600}
              height={600}
              src="contactme.gif"
              alt="hero-contact"
              loader={cloudinaryLoader}
              className="mx-auto hidden w-2/3 lg:block"
            />
          </aside>

          <div className="inline-flex w-full items-center justify-center lg:flex lg:h-full lg:w-2">
            <hr className="my-8 h-px w-64 border-0 bg-gray-200 lg:h-64 lg:w-px" />
            <span className="absolute bg-white px-3 font-medium text-gray-900">{t('divider')}</span>
          </div>

          <form id="contact" className="w-full space-y-5 py-8 px-10" onSubmit={handleSubmit}>
            <p className="text-center text-lg font-bold text-gray-800 lg:text-start">{t('title2')}</p>

            <Input
              ref={nameRef}
              inputProps={{
                id: 'name',
                name: 'name',
                type: 'name',
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

            <button className="mt-6 w-full rounded bg-indigo-700 py-3 font-medium uppercase tracking-widest text-white shadow-lg hover:bg-indigo-900 hover:shadow-none focus:outline-none">
              {t('form.submit')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
