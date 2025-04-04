{
  description = "A Nix-flake-based Node.js development environment";

  inputs.nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1.*.tar.gz";

  outputs = { self, nixpkgs }:
    let
      supportedSystems =
        [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f:
        nixpkgs.lib.genAttrs supportedSystems (system:
          f {
            pkgs = import nixpkgs {
              inherit system;
              overlays = [ self.overlays.default ];
            };
          });
    in {
      overlays.default = final: prev: {
        nodejs = prev.nodejs_22;
        pnpm = prev.pnpm_9;
      };

      devShells = forEachSupportedSystem ({ pkgs }: {
        default = pkgs.mkShell { packages = with pkgs; [ nodejs pnpm ]; };
      });
    };
}
