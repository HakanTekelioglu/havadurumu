"""WSGI entry point.

Uygulamanın kurulumu ``havadurumu.create_app`` içinde tutulur. Bu dosya yalnızca
Flask geliştirme sunucusu ve WSGI sunucuları için geriye dönük giriş noktasıdır.
"""

from havadurumu import create_app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
