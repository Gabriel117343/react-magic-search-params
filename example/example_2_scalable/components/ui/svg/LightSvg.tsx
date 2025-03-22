import React from 'react'

export const LightSvg: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {


  return (
    <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 181.328 181.328"
    xmlSpace="preserve"
    width={props.width ?? "24"}
    height={props.height ?? "24"}
    className={'transition-colors duration-1000  ' + props.className}
    fill={props.fill ?? "currentColor"}
    // strokeWidth={8}


    {...props}
  >
    <path d="M118.473 46.308V14.833a7.5 7.5 0 0 0-7.5-7.5H70.357a7.5 7.5 0 0 0-7.5 7.5v31.474C51.621 54.767 44.34 68.214 44.34 83.331c0 25.543 20.781 46.324 46.324 46.324s46.324-20.781 46.324-46.324c0-15.116-7.28-28.562-18.515-37.023M77.857 22.333h25.615v16.489a46.2 46.2 0 0 0-12.809-1.815c-4.443 0-8.736.642-12.807 1.814V22.333zm12.807 92.322c-17.273 0-31.324-14.052-31.324-31.324s14.052-31.324 31.324-31.324 31.324 14.052 31.324 31.324-14.051 31.324-31.324 31.324M40.595 83.331a7.5 7.5 0 0 0-7.5-7.5H7.5a7.5 7.5 0 0 0 0 15h25.595a7.5 7.5 0 0 0 7.5-7.5m133.233-7.5h-25.595a7.5 7.5 0 0 0 0 15h25.595a7.5 7.5 0 0 0 0-15" />
    <path d="M44.654 47.926a7.47 7.47 0 0 0 5.303 2.197 7.47 7.47 0 0 0 5.303-2.197 7.5 7.5 0 0 0 0-10.606L37.162 19.222a7.5 7.5 0 0 0-10.606 0 7.5 7.5 0 0 0 0 10.606zm92.02 70.809a7.501 7.501 0 0 0-10.607 10.607l18.1 18.098a7.48 7.48 0 0 0 5.303 2.196 7.501 7.501 0 0 0 5.304-12.804zm-92.02.001-18.099 18.098a7.5 7.5 0 0 0 10.606 10.607l18.099-18.098a7.5 7.5 0 0 0 0-10.606 7.5 7.5 0 0 0-10.606-.001m86.717-68.613a7.48 7.48 0 0 0 5.303-2.196l18.1-18.098a7.5 7.5 0 0 0-10.607-10.608l-18.1 18.098a7.5 7.5 0 0 0 5.304 12.804M90.664 133.4a7.5 7.5 0 0 0-7.5 7.5v25.595a7.5 7.5 0 0 0 15 0V140.9a7.5 7.5 0 0 0-7.5-7.5" />
  </svg>
  )
}
