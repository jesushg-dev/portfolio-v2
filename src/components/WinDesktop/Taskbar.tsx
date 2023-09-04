import React from 'react';
import TaskbarIcon, { ITaskbarIcon } from './TaskbarIcon';

const icons: ITaskbarIcon[] = [
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-about-me-96_x6fa0e.webp',
    label: 'About Me',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-mail-96_upmhx3.webp',
    label: 'Mail',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-portfolio-96_opfju0.webp',
    label: 'Portfolio',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-resume-96-alt_wcl4bp.webp',
    label: 'Resume',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-rss-96_wxhdyp.webp',
    label: 'Blog',
  },
];

const Taskbar = () => {
  // <div className="absolute -mt-12 h-12 w-[1536px] bg-[#030C1B] flex items-center">
  return (
    <div className="flex backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 border-slate-50/[0.06]  supports-backdrop-blur:bg-white/95 bg-slate-900/75 bg-gray-900 justify-center items-center fixed bottom-0 w-full">
      <div className="w-full flex items-center justify-between">
        <div className="ml-3 flex group flex-wrap justify-center items-center pl-2 pr-16 py-1 rounded hover:bg-white/10 select-none hover:ring-1 ring-white/5">
          <img src="/icons/sunny-cloud.png" alt="" className="w-7 h-7" />
          <div className="ml-2 text-white">
            <p className="text-xs opacity-95">40°C</p>
            <p className="text-xs opacity-80">Cloudy</p>
          </div>
          <div className="absolute hidden group-hover:block z-20 h-[835px] w-[750px] bg-gray-700/90 top-0 left-4 -mt-[800px] rounded-lg text-gray-200 fadein">
            <div className="relative">
              <p className="absolute left-1/2 -translate-x-1/2 text-3xl mt-5">17:28</p>
              <div className="w-[88px] h-11 bg-gray-600/90 absolute right-4 top-4 rounded-md flex justify-center items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="w-6">
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="rounded-full w-7 aspect-square bg-zinc-200 ml-1 flex justify-center items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className="w-5 fill-zinc-700">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="w-[615px] h-9 bg-zinc-800/90 mt-20 relative left-1/2 -translate-x-1/2 rounded flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
                className="w-5 ml-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                name=""
                id=""
                className="h-7 bg-transparent ml-1 w-11/12 outline-none"
                placeholder="Search the web"
              />
            </div>
            <div className="w-[615px] relative left-1/2 -translate-x-1/2 mt-8">
              <div className="flex justify-between">
                <div className="w-[301px] bg-zinc-800/80 h-[145px] rounded p-4">
                  <div className="flex relative">
                    <img src="/icons/ipl.png" alt="" className="w-4 mr-3" />
                    <p className="opacity-90">Indian Premier League</p>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                      className="w-5 mt-0.5 absolute right-0">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex mt-5 relative">
                    <img src="/icons/csk.png" alt="" className="w-[52px] opacity-80" />
                    <div className="text-sm ml-1 mt-2 opacity-80">
                      <p className="">200/7</p>
                      <p className="">20.0 overs</p>
                    </div>
                    <img src="/icons/mi.png" alt="" className="w-[52px] opacity-80 h-10 absolute right-0 mt-1" />
                    <div className="text-sm ml-6 mt-2 opacity-80">
                      <p className="text-right">138/7</p>
                      <p className="">16.8 overs</p>
                    </div>
                  </div>
                  <p className="text-sm mt-2 text-center text-cyan-500 opacity-80 hover:opacity-100 transition-all ease-in-out">
                    <a href="https://www.cricbuzz.com/" target="_blank" rel="noopener noreferrer">
                      See more about IPL
                    </a>
                  </p>
                </div>
                <div className="w-[301px] bg-zinc-800/80 h-[145px] rounded p-4">
                  <div className="flex relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 mr-2 stroke-green-400"
                      viewBox="0 0 24 24"
                      strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="opacity-90">Stock Market</p>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                      className="w-5 mt-0.5 absolute right-0">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                      />
                    </svg>
                  </div>
                  <div className="px-4 pt-4 opacity-90">
                    <span className="flex justify-between">
                      <p className="">Apple Inc.</p>
                      <p className="">+1.35%</p>
                    </span>
                    <span className="flex justify-between">
                      <p className="">Tata Motors</p>
                      <p className="">+0.35%</p>
                    </span>
                  </div>
                  <p className="text-sm mt-2.5 text-center text-cyan-500 opacity-80 hover:opacity-100 transition-all ease-in-out">
                    <a
                      href="https://www.nseindia.com/market-data/live-equity-market"
                      target="_blank"
                      rel="noopener noreferrer">
                      Check stock prices
                    </a>
                  </p>
                </div>
              </div>
              <div className="bg-zinc-800/80 w-full h-[500px] rounded p-4 mt-4">
                <div className="flex relative items-center">
                  <img src="/icons/todo.png" alt="" className="w-5 mr-3" />
                  <p className="opacity-90">To Do</p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-5 mt-0.5 absolute right-0">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                    />
                  </svg>
                </div>
                <div className="flex bg-zinc-100/10 hover:bg-zinc-100/20 transition-all ease-in-out w-max px-1 pr-2 py-1 rounded mt-4 ml-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <p className="ml-1 font-medium">Tasks</p>
                </div>
                <div className="px-4 p-4">
                  <a
                    href="https://github.com/VishwaGauravIn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-10 rounded bg-zinc-100/20 px-2 flex items-center hover:bg-zinc-100/30 transition-all ease-in-out">
                    <input type="checkbox" name="" id="" className="outline-none w-4 h-4 accent-cyan-400" />
                    <p className="ml-2 text-sm">Visit our GitHub</p>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/VishwaGauravIn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-10 rounded bg-zinc-100/20 px-2 flex items-center mt-4 hover:bg-zinc-100/30 transition-all ease-in-out">
                    <input type="checkbox" name="" id="" className="outline-none w-4 h-4 accent-cyan-400" />
                    <p className="ml-2 text-sm">Follow us on LinkedIn</p>
                  </a>
                  <a
                    href="https://twitter.com/vishwagauravin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-10 rounded bg-zinc-100/20 px-2 flex items-center mt-4 hover:bg-zinc-100/30 transition-all ease-in-out">
                    <input type="checkbox" name="" id="" className="outline-none w-4 h-4 accent-cyan-400" />
                    <p className="ml-2 text-sm">Check our tweets !</p>
                  </a>
                  <a
                    href="https://github.com/VishwaGauravIn/windows11-clone"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-10 rounded bg-zinc-100/20 hover:bg-zinc-100/30 transition-all ease-in-out px-2 flex items-center mt-4">
                    <input type="checkbox" name="" id="" className="outline-none w-4 h-4 accent-cyan-400" />
                    <p className="ml-2 text-sm">Contribute to our Project</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-1">
          {icons.map((icon, index) => (
            <TaskbarIcon key={String(index)} icon={icon.icon} label={icon.label} />
          ))}
        </div>
        <div className="mr-3 opacity-90 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
            className="w-[24px] stroke-[1] hover:bg-white/10 h-12 px-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
            className="w-[24px] stroke-[1] hover:bg-white/10 h-12 -scale-x-100 px-0.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <div className="flex flex-wrap space-x-2 px-2 ml-1 rounded hover:bg-white/10 select-none hover:ring-1 ring-white/5 py-2.5 group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
              className="w-[18px] stroke-[2]">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
              className="w-[18px] stroke-[2]">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                clipRule="evenodd"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] stroke-[2] fill-white" viewBox="0 0 16 16">
              <path d="M2 6h5v4H2V6z" />
              <path d="M2 4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H2zm10 1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h10zm4 3a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8z" />
            </svg>
            <div className="hidden group-hover:block w-[357px] h-[394px] bg-zinc-800/90 absolute right-0.5 bottom-3 rounded-lg ring-1 ring-zinc-300/10 p-5 fadein z-10">
              <div className="flex justify-between text-sm">
                <div className="w-[98px] h-[51px] bg-cyan-400 rounded-md ring-1 ring-zinc-300/10 relative flex justify-center hover:bg-cyan-300 transition-all ease-in-out">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-5 mr-6 stroke-gray-800">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-5 stroke-gray-800">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-95">WiFi</p>
                </div>
                <div className="w-[98px] h-[51px] bg-zinc-100/20 rounded-md ring-1 ring-zinc-300/10 relative flex justify-center hover:bg-zinc-100/30 transition-all ease-in-out">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 fill-zinc-100" viewBox="0 0 16 16">
                    <path
                      fillRule="evenodd"
                      d="m8.543 3.948 1.316 1.316L8.543 6.58V3.948Zm0 8.104 1.316-1.316L8.543 9.42v2.632Zm-1.41-4.043L4.275 5.133l.827-.827L7.377 6.58V1.128l4.137 4.136L8.787 8.01l2.745 2.745-4.136 4.137V9.42l-2.294 2.274-.827-.827L7.133 8.01ZM7.903 16c3.498 0 5.904-1.655 5.904-8.01 0-6.335-2.406-7.99-5.903-7.99C4.407 0 2 1.655 2 8.01 2 14.344 4.407 16 7.904 16Z"
                    />
                  </svg>
                  <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-95">Bluetooth</p>
                </div>
                <div className="w-[98px] h-[51px] bg-zinc-100/20 rounded-md ring-1 ring-zinc-300/10 relative flex justify-center hover:bg-zinc-100/30 transition-all ease-in-out">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-max opacity-95">Airplane mode</p>
                </div>
              </div>
              <div className="flex justify-between text-sm mt-12">
                <div className="w-[98px] h-[51px] bg-zinc-100/20 rounded-md ring-1 ring-zinc-300/10 relative flex justify-center hover:bg-zinc-100/30 transition-all ease-in-out">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 fill-zinc-100" viewBox="0 0 16 16">
                    <path d="M9.585 2.568a.5.5 0 0 1 .226.58L8.677 6.832h1.99a.5.5 0 0 1 .364.843l-5.334 5.667a.5.5 0 0 1-.842-.49L5.99 9.167H4a.5.5 0 0 1-.364-.843l5.333-5.667a.5.5 0 0 1 .616-.09z" />
                    <path d="M2 4h4.332l-.94 1H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.38l-.308 1H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                    <path d="M2 6h2.45L2.908 7.639A1.5 1.5 0 0 0 3.313 10H2V6zm8.595-2-.308 1H12a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H9.276l-.942 1H12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.405z" />
                    <path d="M12 10h-1.783l1.542-1.639c.097-.103.178-.218.241-.34V10zm0-3.354V6h-.646a1.5 1.5 0 0 1 .646.646zM16 8a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8z" />
                  </svg>
                  <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-max opacity-95">Battery saver</p>
                </div>
                <div className="w-[98px] h-[51px] bg-cyan-400 rounded-md ring-1 ring-zinc-300/10 relative flex justify-center hover:bg-cyan-300 transition-all ease-in-out">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-5 -rotate-90 stroke-gray-800">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-max opacity-95">Alarms only</p>
                </div>
                <div className="w-[98px] h-[51px] bg-zinc-100/20 rounded-md ring-1 ring-zinc-300/10 relative flex justify-center hover:bg-zinc-100/30 transition-all ease-in-out">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 fill-zinc-100" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                  </svg>
                  <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-max opacity-95">Accessibility</p>
                </div>
              </div>
              <div className="mt-[68px]">
                <div className="flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-4">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <input type="range" name="" id="" className="w-[290px] ml-2" />
                </div>
                <div className="flex mt-11">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-4">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                  <input type="range" name="" id="" className="w-[290px] ml-2" />
                </div>
              </div>
              <div className="absolute bottom-0 h-12 w-[357px] bg-zinc-900 right-[0px] rounded-b-md">
                <div className=" top-4 absolute left-4 flex text-xs items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 fill-white mr-1" viewBox="0 0 16 16">
                    <path d="M2 6h5v4H2V6z" />
                    <path d="M2 4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H2zm10 1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h10zm4 3a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8z" />
                  </svg>{' '}
                  55%
                </div>
                <div className="absolute right-4 flex top-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-5 stroke-1">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                    className="w-5 stroke-1 ml-6">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="flex rounded hover:bg-white/10 select-none hover:ring-1 ring-white/5 mr-2 py-0.5 px-2">
            <div className="text-xs mr-2">
              <p className="text-right">17:28</p>
              <p className="">23-07-2023</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
              className="w-5 stroke-[1.5] -rotate-90">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
