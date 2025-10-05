<div class="container">
  <h1>[[pages:favorites]]</h1>
  <p>these are your favorites:</p>

  {{{ if items.length }}}
    <ul class="list-group">
      {{{ each items }}}
        <li class="list-group-item">
          <a href="{config.relative_path}/topic/{./announcement_id}">
            Announcement #{./announcement_id}
          </a>
        </li>
      {{{ end }}}
    </ul>
  {{{ else }}}
    <div class="alert alert-info">No favorites yet.</div>
  {{{ end }}}
</div>
