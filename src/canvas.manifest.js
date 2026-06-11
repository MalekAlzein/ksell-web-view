export const manifest = {
  screens: {
    scr_iwabvq: { name: "Launcher", route: "/", position: { "x": 0, "y": 0 }, isDefaultRow: true },
    scr_ep6hpn: { name: "Select Ad Plan", route: "/plans", position: { "x": 160, "y": 1820 } },
    scr_893ibw: { name: "Payment", route: "/payment", position: { "x": 2960, "y": 1820 } },
    scr_nozufz: { name: "Transaction History", route: "/history", position: { "x": 1400, "y": 0 }, isDefaultRow: true }
  },
  sections: {
    sec_j2h4rw: { name: "Ad Purchase Flow", x: 0, y: 1600, width: 4320, height: 1180 }
  },
  layers: [
  { kind: "screen", id: "scr_iwabvq" },
  { kind: "screen", id: "scr_nozufz" },
  { kind: "section", id: "sec_j2h4rw", children: [
    { kind: "screen", id: "scr_ep6hpn" },
    { kind: "screen", id: "scr_893ibw" }]
  }]

};