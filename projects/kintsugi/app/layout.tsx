import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Kintsugi | Vuelve a darle vida',description:'Publica tu objeto, encuentra un reparador y sigue su reparación.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-CL"><body>{children}</body></html>}
