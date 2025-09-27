<li data-action="toggle-favorite" component="topic/favorite" class="dropdown-item d-flex align-items-center gap-2" data-favorited="{favorited}">
  <span class="menu-icon d-inline-flex align-items-center justify-content-center" style="width: 1.25rem;">

    <i component="topic/favorite/off" class="fa fa-fw fa-star-o text-primary {{{ if favorited }}}hidden{{{ end }}}"></i>
  </span>
  <span class="text-capitalize">[[topic:favorite]]</span>
</li>
