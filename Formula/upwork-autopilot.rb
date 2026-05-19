# typed: false
# frozen_string_literal: true

class UpworkAutopilot < Formula
  desc "Codex plugin for controlled Upwork application sessions"
  homepage "https://github.com/klajdikkolaj/upwork-autopilot"
  url "https://registry.npmjs.org/upwork-autopilot/-/upwork-autopilot-0.4.0.tgz"
  sha256 "56c5b8b5d57a953fd89ce5105d7cec1ea5252cd8807ded91fd850a14034e61b4"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec/"bin/upwork-autopilot"
  end

  def caveats
    <<~EOS
      Install or refresh the Codex plugin marketplace entry:
        upwork-autopilot install-home

      Then configure your local applicant profile:
        upwork-autopilot setup-profile
    EOS
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/upwork-autopilot --version")
    assert_match "install-home", shell_output("#{bin}/upwork-autopilot --help")
  end
end
