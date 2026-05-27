FROM octoboxio/octobox
COPY patches/notifications_controller.rb /usr/src/app/app/controllers/notifications_controller.rb
COPY patches/inclusive_scope.rb /usr/src/app/lib/octobox/notifications/inclusive_scope.rb
