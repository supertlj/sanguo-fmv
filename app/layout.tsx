import './globals.css';
import { GameProvider } from '../context/GameContext';

export const metadata = {
  title: '代號三國：龍起 - FMV Engine',
  description: 'Interactive Movie Framework',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet" />
      </head>
      <body>
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
