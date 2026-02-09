const performanceData = [
    { month: "Jan", value: 20 },
    { month: "Feb", value: 35 },
    { month: "Mar", value: 25 },
    { month: "Apr", value: 45 },
    { month: "May", value: 40 },
    { month: "Jun", value: 55 },
];

const HomePerformanceChart = () => {
    return (
        <div className="home-performance-chart h-[230px] flex-1" style={{ paddingTop: '18px' }}>
            <h3 className="text-lg font-bold text-sunbird-obsidian" style={{ marginBottom: '5px' }}>Performance</h3>

            {/* Chart Area */}
            <div className="relative w-full mb-0">
                {/* SVG Grid & Wave */}
                <div className="relative w-full" style={{ height: '100px' }}>
                    <svg viewBox="0 0 310 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
                        {/* Grid Lines */}
                        <g className="opacity-50">
                            <rect x="0.5" y="0.5" width="309" height="99" stroke="var(--sunbird-gray-e5)" />
                            <line x1="0.5" y1="20" x2="309.5" y2="20" stroke="var(--sunbird-gray-f3)" />
                            <line x1="0.5" y1="40" x2="309.5" y2="40" stroke="var(--sunbird-gray-f3)" />
                            <line x1="0.5" y1="60" x2="309.5" y2="60" stroke="var(--sunbird-gray-f3)" />
                            <line x1="0.5" y1="80" x2="309.5" y2="80" stroke="var(--sunbird-gray-f3)" />
                            <line x1="62" y1="0.5" x2="62" y2="99.5" stroke="var(--sunbird-gray-f3)" />
                            <line x1="124" y1="0.5" x2="124" y2="99.5" stroke="var(--sunbird-gray-f3)" />
                            <line x1="186" y1="0.5" x2="186" y2="99.5" stroke="var(--sunbird-gray-f3)" />
                            <line x1="248" y1="0.5" x2="248" y2="99.5" stroke="var(--sunbird-gray-f3)" />
                        </g>
                        <g filter="url(#filter0_d_382_1366)">
                            <path d="M10.2268 85.5L14.2407 83.4565C18.2546 81.413 26.2824 77.326 34.3101 74.4324C42.3379 71.5388 50.3657 69.8386 58.3935 64.7219C66.4212 59.6052 74.449 51.072 82.4768 45.4988C90.5046 39.9255 98.5324 37.3121 106.56 41.8882C114.588 46.4643 122.616 58.2299 130.643 57.5508C138.671 56.8717 146.699 43.7478 154.727 37.0323C162.755 30.3167 170.782 30.0095 178.81 33.8511C186.838 37.6928 194.866 45.6834 202.893 42.8485C210.921 40.0136 218.949 26.3532 226.977 23.0564C235.005 19.7596 243.032 26.8264 251.06 25.3917C259.088 23.957 267.116 14.0208 275.143 9.6623C283.171 5.30382 291.199 6.52304 295.213 7.13266L299.227 7.74227" stroke="var(--sunbird-ginger)" />
                        </g>
                        <defs>
                            <filter id="filter0_d_382_1366" x="0" y="0" width="309.302" height="99.9458" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                                <feOffset dy="4" />
                                <feGaussianBlur stdDeviation="5" />
                                <feComposite in2="hardAlpha" operator="out" />
                                <feColorMatrix type="matrix" values="0 0 0 0 0.8 0 0 0 0 0.521569 0 0 0 0 0.270588 0 0 0 1 0" />
                                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_382_1366" />
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_382_1366" result="shape" />
                            </filter>
                        </defs>
                    </svg>

                    {/* Dot at peak (Near May) */}
                    <div className="absolute top-[28%] left-[80%] w-2 h-2 rounded-full bg-sunbird-ginger border border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 z-10 box-content ring-2 ring-sunbird-ginger/20"></div>
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-between px-2" style={{ marginTop: '5px' }}>
                    <span className="text-xs font-medium text-sunbird-obsidian">Jan</span>
                    <span className="text-xs font-medium text-sunbird-obsidian">Feb</span>
                    <span className="text-xs font-medium text-sunbird-obsidian">Mar</span>
                    <span className="text-xs font-medium text-sunbird-obsidian">Apr</span>
                    <span className="text-xs font-medium text-sunbird-obsidian pl-1">May</span>
                    <span className="text-xs font-medium text-sunbird-obsidian">Jun</span>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-auto flex items-start gap-4" style={{ paddingBottom: '20px', paddingTop: '18px' }}>
                <span className="text-[1.75rem] font-bold text-sunbird-obsidian leading-none">40%</span>
                <p className="text-[11px] text-sunbird-gray-77 leading-[1.3] max-w-[180px]">
                    Your productivity is 40% higher as compared to last month
                </p>
            </div>
        </div>
    );
};

export default HomePerformanceChart;
