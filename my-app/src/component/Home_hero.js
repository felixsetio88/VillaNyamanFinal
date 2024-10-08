import React from "react";

export default function Home_hero(){
    return (
        <>
        <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true">

        </div>
        <div className="mx-auto max-w-[1280px] py-16 sm:py-32 lg:py-8">
                <div className="hidden sm:mb-8 sm:flex sm:justify-center">

                </div>
                <div>
                    <h1 className="py-12 font-poppins text-[30px] font-bold text-gray-900 sm:text-[75px]">
                        Stay Comfortable Only With Us
                    </h1>
                    <p className="mt-1 text-lg font-poppins leading-8 text-gray-600">
                        With more than 10 years of experience, we're ready to serve you!
                    </p>
                    <div className="mt-10 flex  gap-x-6">
                        <a href="#explore" className="text-lg font-poppins font-semibold leading-6 text-gray-900">
                            Explore <span aria-hidden="true">→</span>
                        </a>
                    </div>
                </div>
            </div><div
                className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                aria-hidden="true"
            >
                <div
                    className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                    style={{
                        clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                    }} />
            </div></>
    )
}

