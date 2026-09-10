export type DMThread = {
  id: number;
  name: string;
  official?: boolean;
  system?: boolean;
  last: string;
  time: string;
  unread: number;
  online: boolean;
  convId?: number;
  publicId?: string;
  otherId?: number;
  photo?: string;
  ozelIdTip?: "premium" | "kapsul" | null;
  ozelIdTema?: string | null;
  sabit?: boolean;
  cerceve?: string;
};

export const DM_THREADS: DMThread[] = [
  { id: 1, name: "Aron", official: true, last: '"Samimi değilsen uzak ol!" etkinliği başlamak üzere', time: "Cuma 20:58", unread: 0, online: true },
  { id: 2, name: "Sistem", system: true, last: "Üye rozetin grileşti", time: "20/05 21:00", unread: 0, online: true },
  { id: 3, name: "Mervee", last: "Odaya gelsene, konuşalım biraz 🎀", time: "21:48", unread: 2, online: true },
  { id: 4, name: "Zeno Sv.", last: "Akşam yayın var mı?", time: "21:45", unread: 1, online: true },
  { id: 5, name: "Lunas", last: "Tamamdır, bekliyorum seni ✨", time: "21:43", unread: 0, online: true },
  { id: 6, name: "Ender", last: "Sesli odan çok keyifli yaa 🔥", time: "21:40", unread: 0, online: true },
  { id: 7, name: "Furkan", last: "Yarın birlikte yayın açalım mı?", time: "21:38", unread: 0, online: false },
  { id: 8, name: "Rüya", last: "İyi geceler, görüşürüz 💜", time: "21:35", unread: 0, online: false },
  { id: 9, name: "Melis", last: "Teşekkürler 🙏", time: "21:30", unread: 0, online: true },
];

