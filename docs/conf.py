# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html
# https://www.sphinx-doc.org/en/master/usage/configuration.html#example-of-configuration-file

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
# import os
# import sys
# sys.path.insert(0, os.path.abspath('.'))

from datetime import datetime
import sphinx_rtd_theme


# -- Project information -----------------------------------------------------

project = 'Ladder99'
author = 'MRIIOT LLC'
copyright = str(datetime.now().year) + ', MRIIOT LLC'
# root_doc = 'page/contents'

# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    "sphinx_rtd_theme",
    # "sphinx_tabs",
    # myst handles markdown files - see https://www.sphinx-doc.org/en/master/usage/markdown.html
    "myst_parser",
]

# Add any paths that contain templates here, relative to this directory.
# templates_path = ['_templates']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = ['README.md', 'page/future', 'page/old']


# -- Options for HTML output -------------------------------------------------

# The name for this set of Sphinx documents.
# "<project> v<release> documentation" by default.
# html_title = u'test vtest'

# A shorter title for the navigation bar.  Default is the same as html_title.
# html_short_title = None

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
# html_theme = 'alabaster'
html_theme = "sphinx_rtd_theme"

# The name of an image file (relative to this directory) to place at the top
# of the sidebar.
html_logo = 'page/_images/Ladder99Logo-gray.png'

# The name of an image file (relative to this directory) to use as a favicon of
# the docs.  This file should be a Windows icon file (.ico) being 16x16 or 32x32
# pixels large.
html_favicon = 'page/_images/favicon.ico'

# Theme options are theme-specific and customize the look and feel of a theme
# further.  For a list of options available for each theme, see the documentation.

html_theme_options = {
    'logo_only': True,
    # 'collapse_navigation': False,
}

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['page/_static']

# custom.css is inside one of the html_static_path folders (e.g. _static).
# note: changing the styles in this file might take a while to propagate.
# click shift+refresh to see if that will bypass the cache.
html_css_files = ["custom.css"]

# Add any extra paths that contain custom files (such as robots.txt or
# .htaccess) here, relative to this directory. These files are copied
# directly to the root of the documentation.
# html_extra_path = []


# def setup(app):
#     app.add_css_file('custom.css')


sphinx_tabs_disable_tab_closing = True


# -- Myst configuration ---------------------------------------------------

# see https://myst-parser.readthedocs.io/en/latest/syntax/optional.html
myst_enable_extensions = [
    # "amsmath",
    # "colon_fence",
    # "deflist",
    # "dollarmath",
    # "html_admonition",
    # "html_image",
    "linkify",
    # "replacements",
    # "smartquotes",
    # "substitution",
    # "tasklist",
]

# The MyST Parser can automatically generate label “slugs” for header anchors 
# so that you can reference them from markdown links. For example, you can 
# use header bookmark links, locally; [](#header-anchor), or 
# cross-file [](path/to/file.md#header-anchor). 
myst_heading_anchors = 3
