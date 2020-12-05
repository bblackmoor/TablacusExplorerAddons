#include "resource.h"
#include <windows.h>
#include <vector>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")

#define TE_METHOD		0x60010000
#define TE_METHOD_MAX	0x6001ffff
#define TE_METHOD_MASK	0x0000ffff
#define TE_PROPERTY		0x40010000

// C/Migemo functions
typedef void* (WINAPI* LPFNmigemo_open)(const char* dict);
typedef void (WINAPI* LPFNmigemo_close)(void* object);
typedef unsigned char* (WINAPI* LPFNmigemo_query)(void* object, const unsigned char* query);
typedef void (WINAPI* LPFNmigemo_release)(void* object, unsigned char* string);
typedef int (WINAPI* LPFNmigemo_load)(void* obj, int dict_id, const char* dict_file);
typedef int (WINAPI* LPFNmigemo_is_enable)(void* obj);

// Migemo Wrapper Object
class CteMigemo : public IDispatch
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	//IDispatch
	STDMETHODIMP GetTypeInfoCount(UINT *pctinfo);
	STDMETHODIMP GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo);
	STDMETHODIMP GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId);
	STDMETHODIMP Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr);

	CteMigemo();
	~CteMigemo();

	VOID Close();

	HMODULE		m_hMigemo;
private:
	LPFNmigemo_open migemo_open;
	LPFNmigemo_close migemo_close;
	LPFNmigemo_query migemo_query;
	LPFNmigemo_release migemo_release;
	LPFNmigemo_load migemo_load;
	LPFNmigemo_is_enable migemo_is_enable;

	void		*m_pMigemo;
	LONG		m_cRef;
	int			m_CP;
};

class CteClassFactory : public IClassFactory
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	
	STDMETHODIMP CreateInstance(IUnknown *pUnkOuter, REFIID riid, void **ppvObject);
	STDMETHODIMP LockServer(BOOL fLock);
};

//CteDispatch
class CteDispatch : public IDispatch
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	//IDispatch
	STDMETHODIMP GetTypeInfoCount(UINT *pctinfo);
	STDMETHODIMP GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo);
	STDMETHODIMP GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId);
	STDMETHODIMP Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr);

	CteDispatch(IDispatch *pDispatch, int nMode, DISPID dispId);
	~CteDispatch();

	VOID Clear();
public:
	DISPID		m_dispIdMember;
private:
	IDispatch	*m_pDispatch;
	LONG		m_cRef;
};
