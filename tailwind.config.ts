/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans", "sans-serif"], // Adding Open Sans as the default sans-serif font
      },
      fontSize: {
        base: "62.5%", // default browser font size now 10px instead of 16px
        1: "1px",
        2: "2px",
        3: "3px",
        4: "0.4rem", // 0.4rem => 4px now, etc.
        6: "0.6rem",
        8: "0.8rem",
        10: "1rem",
        12: "1.2rem",
        14: "1.4rem",
        16: "1.6rem",
        18: "1.8rem",
        20: "2rem",
        24: "2.4rem",
        28: "2.8rem",
        32: "3.2rem",
        36: "3.6rem",
        40: "4rem",
        48: "4.8rem",
        60: "6rem",
        72: "7.2rem",
      },
      spacing: {
        1: "1px",
        2: "2px",
        3: "3px",
        4: "0.4rem", // 0.4rem => 4px now, etc.
        6: "0.6rem",
        8: "0.8rem",
        10: "1rem",
        12: "1.2rem",
        14: "1.4rem",
        16: "1.6rem",
        18: "1.8rem",
        20: "2rem",
        24: "2.4rem",
        28: "2.8rem",
        32: "3.2rem",
        36: "3.6rem",
        40: "4rem",
        48: "4.8rem",
        60: "6rem",
        72: "7.2rem",
      },
      screens: {
        xs: "240px", // 240px
        sm: "576px", // 576px
        md: "768px", // 768px
        lg: "992px", // 992px
        xl: "1200px", // 1200px
      },
      borderRadius: {
        none: "0",
        xs: "1px",
        sm: "2px",
        DEFAULT: "5px",
        md: "8px",
        lg: "10px",
        xl: "15px",
      },
    },
  },
  plugins: [],
};
