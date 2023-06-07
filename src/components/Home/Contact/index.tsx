import React, { FC, useRef } from 'react';

import Image from 'next/image';
import type { ImageLoaderProps } from 'next/dist/client/image';

import Input from '../../UI/Input';
import ContactItem from './ContactItem';
import TextArea from '../../UI/TextArea';
import type { IInputRef } from '../../../hooks/useRefInput';

import { FaLinkedin, FaGithub, FaWhatsapp, FaRegEnvelope, FaPhoneAlt } from 'react-icons/fa';

import { useTranslations } from 'next-intl';

interface IContactProps {}

const cloudinaryLoader = ({ src, width, quality }: ImageLoaderProps) => {
  const qualityString = quality ? ',q_' + quality : '';
  return `https://res.cloudinary.com/js-media/image/upload/w_${width}${qualityString},c_limit/v1670990294/portfolio/hero/${src}`;
};

const Contact: FC<IContactProps> = ({}) => {
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
    console.log('🚀 ~ file: index.tsx:73 ~ sendEmail ~ res', res);

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
    <section id="contact" className="hero w-full bg-black before:bg-hero-contact before:lg:bg-local">
      <div className="mx-auto flex items-center p-4 lg:container lg:p-20">
        <div className="z-20 flex w-full flex-col rounded bg-background-50 md:flex-row md:items-center">
          <aside className="flex w-full flex-col justify-between space-y-10 px-10 py-8">
            <div className="space-y-3">
              <div className="container mx-auto">
                <div className="-mx-4 flex flex-wrap">
                  <div className="w-full px-4">
                    <div className="mx-auto mb-4 text-center">
                      <h2 className="mb-4 text-3xl font-bold text-primaryText-900 sm:text-4xl md:text-[40px]">
                        {t('title')}
                      </h2>
                      <p className="text-body-color text-base">{t('subtitle')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <ul className="-ml-3 flex flex-wrap justify-center gap-2">
                <li>
                  <ContactItem label="linkedin" href="https://linkedin.com/in/jesus-hernandez23" icon={FaLinkedin} />
                </li>
                <li>
                  <ContactItem label="github" href="https://github.com/jess232017" icon={FaGithub} />
                </li>
                <li>
                  <ContactItem label="whatsapp" href="https://wa.me/+50586793204" icon={FaWhatsapp} />
                </li>
                <li>
                  <ContactItem label="phone" href="tel:86793204" icon={FaPhoneAlt} />
                </li>
                <li>
                  <ContactItem label="email" href="mailto:jess232016@gmail.com" icon={FaRegEnvelope} />
                </li>
              </ul>
            </div>
            <Image
              width={600}
              height={600}
              src="contactme.gif"
              alt="hero-contact"
              loader={cloudinaryLoader}
              className="mx-auto hidden w-1/2 lg:block"
            />
          </aside>

          <div className="inline-flex w-full items-center justify-center md:flex md:h-full md:w-2">
            <hr className="my-8 h-px w-64 border-0 bg-background-200 lg:h-64 lg:w-px" />
            <span className="absolute bg-background-50 px-3 font-medium text-primaryText-900">{t('divider')}</span>
          </div>

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
        </div>
      </div>
    </section>
  );
};

export default Contact;
